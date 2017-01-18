
var http= require('http'); // залежності 
var fs= require('fs');// файлова система 
var socketio= require('socket.io');
var html =require('escape-html');
var emoji = require('node-emoji').emoji;

var server= http.createServer();

var io=socketio(server);// обробка сокетів через наш сервер

var port = process.env.PORT || 5000;;
//серевер посркдник получает дание с одного сокета и разсилает всем подключенним сокетам 
fs.readFile('./index.html', function(err, html_string) {
    
    if(err) {
        
        throw err;
    }
    var nik = 'jd';
    nik.fontcolor("green");
    io.on("connection", function(socket){
        
        socket.on("message", function(data){
        console.log(emoji.heart);
        console.log(data.nickname);
//            data.message.style.color = "#ff0000";
            socket.broadcast.emit('message', {
                nickname: data.nickname,
                message: data.message
            })
            
            // броадкаст перекидает дание другим сокетам  (отправлять всем остальним дание )
            //броадкаст отправлякт сообщения на сторонк клиенти 
            //тут можга задать что елемент которий ви отправили у другого сокета будет отобрпжптса справа 
            
            
        })
    })
    
    server.on('request', function(request,response){
        
        response.writeHeader(200, {'Content-Type': 'text/html'});// тип контенту 
        response.end(html_string);// конец оброботки даних  
    })
    
    server.listen(port, function(){
        console.log('Server is running on port' + port);
    })
})



