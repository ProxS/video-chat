var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(1234);

var io = require('socket.io').listen(app);
var users = {};
var rooms = {};

io.sockets.on('connection', function (socket) {
    
    socket.on('id', function(id) {
        
        if(socket.user_id === undefined) {
            socket.user_id = id;    
        }
        
        var role = socket.user_id.split('-')[0];
        
        if (role == 'Tech') {
            var room = 'chatRoom-' + socket.user_id;
            rooms[room] = [socket.user_id];
            socket.room = room;
            socket.join(room);
        } else if (role == 'User') {
            var accessRooms = io.sockets.adapter.rooms;
            
            for() {
                
            }
            
            var room = 'chatRoom-Tech';
            //пройтись по соккету и п
            socket.room = room;
            socket.join(room);
            rooms[room].push(socket.user_id)
        }
        
//        console.log(rooms);
        console.log(rooms);

    });    
        
	socket.on('message', function (message) {
		console.log('Got message: ' + message);
		socket.broadcast.emit('message', message);
	});

	socket.on('speak_room', function (videoFlow) {
        
//        var rooms = data;
        
        // получение комнат
//        io.sockets.adapter.rooms
        
//        var room = 'admin';
        
//        console.log(data);
//        
//        users[data.id] = socket;
//        socket.room = room;
//        socket.join(socket.room);
//        socket.user_id = data.id;
//        socket.message = data.message;
//        console.log(io.sockets.adapter.rooms);
        //поправить рассылку по комнатам
        console.log(socket.room);
        socket.broadcast.to(socket.room).emit('speak_room', videoFlow);
	});

    socket.on('chat message', function(msg){
        var user_id = socket.user_id;
        socket.broadcast.to(socket.room).emit('chat message', msg);
        console.log(user_id + ' message ' + msg + ' room : ' + socket.room);
    });
    
    socket.on("disconnect", function() {
        socket.broadcast.to(socket.room).emit("leave", socket.user_id);
        delete users[socket.user_id];
        delete rooms[socket.room];
    });
    
    
});