var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(1234);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {

	socket.on('message', function (message) {
		console.log('Got message: ' + message);
		socket.broadcast.emit('message', message);
	});

	socket.on('speak_room', function (room) {

        
        socket.emit('speak_room', room);
        
	});
    socket.on('chat message', function(msg){
        var name = 'Socket-' + socket.id;
        io.emit('chat message', msg);
        console.log(name + ' message ' + msg);
    });
    
});