var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
//var app = require('express');

var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(1234);

var io = require('socket.io').listen(app);
var users = {};

io.sockets.on('connection', function (socket) {
	socket.on('message', function (message) {
		console.log('Got message: ' + message);
		socket.broadcast.emit('message', message);
	});
    
	socket.on('check', function (message) {
		console.log('Got message: ' + message);
        if (message === 'user') {
            io.emit('check', message);
        }
//		io.emit('check', message);
	});
    
    socket.on('room', function(roomData){
        var json = JSON.parse(roomData);
        var rooms = io.sockets.adapter.rooms;
        json.room = json.room[1];
        
        //to do добавить обход по комнатам комнат
//        for (i = 0; i < 10; i++) {
//            room[i] = 'chatRoom_' + i;
//            console.log(i);
//        }
        
//        console.log(io.sockets.adapter.rooms);  
//        console.log(io.eio.clients[group];);
                
        console.log(roomData);
        console.log(json);
        
        users[json.id] = socket;
        socket.room = json.room;
        socket.join(socket.room);
        socket.user_id = json.id;
        socket.message = json.message;
        //to do добавить отправку видеопотока
        socket.broadcast.to(socket.room).emit('room', JSON.stringify(json.message));
    });
    
    socket.on("disconnect", function() {
            socket.broadcast.to(socket.room).emit("leave", socket.user_id);
            delete users[socket.user_id];
    });
    
    socket.on('chat message', function(msg){
        var user_id = socket.user_id;
        socket.join(socket.room);
        socket.broadcast.to(socket.room).emit('chat message', msg);
        console.log(user_id + ' message ' + msg);
        console.log(socket.room);
    });
});