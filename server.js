var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
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
        
        json.room = json.room[1];
        
        //to do добавить обход по комнатам комнат
//        for (i = 0; i < 10; i++) {
//            room[i] = 'chatRoom_' + i;
//            console.log(i);
//        }
        
        
//        console.log(io.sockets.adapter.rooms);
//        
//        console.log(io.eio.clients[group];);
        
        
        users[json.id] = socket;
        socket.room = json.room;
        socket.join(socket.room);
        socket.user_id = json.id;
        socket.message = json.message;
        //to do добавить отправку видеопотока
        socket.broadcast.to(socket.room).emit('room', json.message);
        console.log(socket.room);
    });
    
    socket.on("disconnect", function() {
            socket.broadcast.to(socket.room).emit("leave", socket.user_id);
            delete users[socket.user_id];
    });
    
    
    
    
    
//	socket.on('create or join', function (room) {
//		//todo посчитить подключившихся
//        var numClients = 2;
//        
//		console.log('Room ' + room + ' has ' + numClients + ' client(s)');
//		console.log('Request to create or join room', room);
//
//		if(numClients == 0) {
//			socket.join(room);
//			socket.emit('created', room);
//            console.log(room);
//		} 
//
//		else if(numClients == 1) {
//			io.sockets.in(room).emit('join', room);
//			socket.join(room);
//			socket.emit('joined', room);
//            console.log('connected to ' + room);
//		} 
//
//		else {
//			socket.emit('full', room);
//            console.log('full');
//		}
//
//		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
//		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
//	});
   
    socket.on('chat message', function(msg){
        var name = 'Socket-' + socket.id;
        socket.join(socket.room);
        socket.broadcast.to(socket.room).emit('chat message', msg);
        console.log(name + ' message ' + msg);
        console.log(socket.room);
    });
});