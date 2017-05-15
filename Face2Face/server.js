
var express	= require('express');
var session	=require('express-session');
var multer = require('multer');
var cors = require('cors');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var path =require("path");



var app	= express();

var port = process.env.PORT || 5000;

var server=app.listen(port,function(){
  console.log("App Started on PORT 3000");
});

var io = require('socket.io').listen(server);


//MYSQL CONNECTION
var connection =  mysql.createConnection({
    host:"localhost",
    user: "root",
    password:"123456789max",
    database:"face2face"
});




app.set('views', __dirname + '/views'); // for index.html (temlate)
app.use(express.static(__dirname + '/public')); // for style.css and js
app.engine('html', require('ejs').renderFile);

app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());



var sess;

app.get('/',function(req,res){

    
	sess=req.session;
	if(sess.logins)
	{
		res.redirect('/profile');
	}
	else{
	res.render('login.html');
	}
});



//
//app.post('/login',function(req,res){
//	sess=req.session;	
//	sess.email=req.body.email;
//	res.end('done');
//});
//
//app.get('/admin',function(req,res){
//	sess=req.session;
//	if(sess.email)	
//	{
//		res.write('<h1>Hello'+sess.email+'</h1><br>');
//		res.end('<a href='+'/logout'+'>Logout</a>');
//	}
//	else
//	{
//		res.write('<h1>Please login first.</h1>');
//		res.end('<a href='+'/'+'>Login</a>');
//	}
//
//});
//
//app.get('/logout',function(req,res){
//	
//	req.session.destroy(function(err){
//		if(err){
//			console.log(err);
//		}
//		else
//		{
//			res.redirect('/');
//		}
//	});
//
//});


//USERS RENDER TEMPLATE
app.get('/profile',function(req,res){
	sess=req.session;
	if(sess.logins)	{
        
        res.render('profile.html');
	}
	else
	{
		res.write('<h1>Please login first.</h1>');
		res.end('<a href='+'/'+'>Login</a>');
	}
});

// USERS DATA


app.get('/profile.json',function(req,res){

    
  // var UsersData = {
  //     login:sess.logins,
  //     email:sess.email,
  //     profilephoto:sess.profilephoto
  // }
  
  connection.query('select * from users',(err,rows)=>{
    sess = req.session;

   for(var i = 0;i < rows.length; i++){
            var u = rows[i];
       
            if( sess.logins == u.logins){
                
                sess.bio = u.bio;
                sess.profilephoto = u.userphoto;
                sess.gender = u.gender;
                sess.usersid = u.usersid;

                

                var UserData = {

                    login: sess.logins,
                    email: sess.email,
                    bio: sess.bio,
                    profilephoto:sess.profilephoto,
                    gender:sess.gender,
                    myroom:sess.usersid
                }
                
                res.json(UserData);
                
            }
     };
      
  });
//   res.json(UsersData);
  
});




//function UserAutorization (req,res){
//    res.send(sess.logins);
//};



//LOGIN
app.post('/autorization',function(req,res){
    connection.query('select * from users',(err,rows)=>{
        if (err)
        throw (err);
        var foundUser = undefined;
        for(var i = 0;i < rows.length; i++){
            var u = rows[i];
            if( req.body.logins == u.logins && req.body.passwords == u.passwords ){
                var usersid = u.usersid;
                var emails = u.emails;
//                var userphoto = u.userphoto;
                foundUser = u.logins;
                
        }
    }
            if (foundUser !== undefined) {
                sess = req.session;
                sess.usersid = usersid;
	              sess.logins = req.body.logins;
                sess.email = emails;
//                sess.profilephoto = userphoto;
                
                
            }
            res.end('done');
    })
});

//LOGOUT
app.get('/logout',function(req,res){
	
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else
		{
			res.redirect('/');
		}
	});

});

//PROFILE INFO
app.post('/profileinfo', function(req,res){
    
    var usersid = sess.usersid.toString();
    
    var ProfileInfo = {
        bio: req.body.bio,
        gender: req.body.gender,
//        phone: req.body.phone,
        location: req.body.location
    };
    connection.query('UPDATE users SET ? WHERE usersid = '+usersid+' ', ProfileInfo,(err)=>{
        if(err)throw err;
        console.log('profile has been changed', ProfileInfo);
    });
    res.send(200);
    
});


//MULTER SEATINGS 
var storage = multer.diskStorage({   
  destination: function (req, file, cb) {
      cb(null, 'public/uploads/')
  },
   	filename: function(req, file, callback) {  
		callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
    
});

var upload = multer({
    
    storage:storage, 
    
    
        fileFilter: function(req,file,cb){
    
        if( file.mimetype != 'image/png' && file.mimetype != 'image/jpeg'){
          req.fileValidationError = 'goes wrong on the mimetype';
          return cb(null, false, new Error('goes wrong on the mimetype'));  
        }
        cb(null, true);
    }

}
).single('file');


//UPLOAD USER PHOTO
app.post('/userphoto',upload,function(req,res,next){
    if(req.fileValidationError) {
              return res.end(req.fileValidationError);
        }
    
    var ImageName = req.file.filename;
    
    var usersid = sess.usersid.toString();
    
    if(ImageName != undefined && ImageName != null){
      
        
    connection.query("update users set userphoto = '"+ImageName+"' where usersid = '"+usersid+"' ",(err) =>{
    if(err)throw err;
   
});
        res.send(200);
    
    
    };
    
    console.log(ImageName);
});





//FRIENDS 

//PEOPLE IN FACE2FACE
app.get('/users',function(req,res,next){
    sess = req.session;
    var usersid = sess.usersid.toString();
    
    connection.query("select logins , usersid , userphoto from users where usersid !='"+usersid+"' ",(err,rows)=>{
//    connection.query("select users.logins , users.usersid , users.userphoto from users left join friends on users.usersid = friends.fk_users where users.usersid !='"+usersid+"' and friends.usersid <> '"+usersid+"' or friends.usersid  IS NULL and users.usersid !='"+usersid+"'",(err,rows)=>{

     if(err)throw err;
      res.send(rows);

    });
   
});
//USER FRIENDS
app.get('/friends',function(req,res){
    sess=req.session;
    var usersid = sess.usersid.toString();
    //console.log('my id is '+usersid);

    connection.query("select * from friends as f join users as u on f.fk_users = u.usersid  where f.usersid ='"+usersid+"' ",(err,rows)=>{
       res.send(rows);
        // console.log(rows);  
    });

});
   



//ADD FRIENDS 
app.post('/addfriends',function(req,res){
    sess = req.session;
   var friend = req.body.friendid.toString();
   var usersid = sess.usersid.toString();
    
    // I add friend
    connection.query("insert into friends (friendsid,fk_users,usersid) values (null,'"+friend+"','"+usersid+"')",(err,row)=>{
        
       if(err)throw err;
      
    });
//    This friend add me
    connection.query("insert into friends (friendsid,fk_users,usersid) values (null,'"+usersid+"','"+friend+"')",(err,row)=>{
       if(err)throw err;
      
    });
    
    res.send(200);
   console.log(req.body);
   
});













//MESSAGE



  app.post('/choosefriendtomessage', function(req,res){
    sess = req.session;

    sess.friendsrooms = req.body.friendid;
    sess.friendslogins = req.body.friendlogin;

    // friendsroom = sess.friendsrooms;
    // friendslogin = sess.friendslogins;

    console.log('friendsroom ' + sess.friendsrooms);

    res.sendStatus(200);
  
 });


var friendsroom = false;
var friendslogin;
 
app.post('/testSession', function(req,res){
    sess = req.session;
   friendsroom = sess.friendsrooms;
    friendslogin = sess.friendslogins;

  console.log(' now friendsroom ' +friendsroom);

    res.send(200);
});

io.on('connection', function(socket) {

 console.log('connection socket.io');




if(typeof sess == 'object'){

    var myroom  = sess.usersid;
    var login = sess.logins;

     socket.join(myroom);

      var clients = io.sockets.clients();
      // console.log(clients);

     
};

 if(friendsroom != false){
       
        socket.join(friendsroom);   
      }
      
        

         // console.log('room connected '+socket.myroom);
    
    socket.on('message', function(data){
        socket.broadcast.to(friendsroom).emit('message', {  
         
                nickname: login,
                message: data.message,
                rooms:friendslogin
             })
          friendsroom = false;
         console.log('join to' + friendsroom);
    });




    });















  










//REGISTRATION
app.post('/registration',function(req,res){
//    console.log(req.body);
//    res.send(200);
  var RegData = {
        logins:req.body.login,
        firstname:req.body.name,
        emails:req.body.email,
        passwords:req.body.password,
        userphoto:'default.png'
};
connection.query('insert into users set ?',RegData,(err) =>{
    if(err)throw err;
    console.log('regist success',req.body);
});
    res.send(200);
});



 
