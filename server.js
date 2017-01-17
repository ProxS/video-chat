var static = require('node-static');
var http = require('http');
var fs = require("fs");

var file = new(static.Server)();

var users = {};
var rooms = {};

var app = http.createServer(function (req, res) {
	
    file.serve(req, res);
    
    req.on('data', function(data) {
        
        data = data.toString();
        var base64Data = data.replace(/^data:image\/jpeg;base64,/, "");

        fs.writeFile('img/' + generateName() + ".jpeg", base64Data, 'base64', function(err) {
            if (err) {
                console.log(err);
            }
        });
        
    });
        
}).listen(1234);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
    
    socket.on('id', function(id) {
        
        if(socket.user_id === undefined) {
            socket.user_id = id;    
        }
        
        var role = socket.user_id.split('-')[0];
        
        socket.role = role;
        
        if (role == 'Tech') {
            var room = 'chatRoom-' + socket.user_id;
            rooms[room] = [socket.user_id];
            socket.room = room;
            socket.join(room);
        } else if (role == 'User') {
            
            for(var accessRoom in rooms) {
                
                if (rooms[accessRoom].length == 1) {
                    var room = accessRoom;
                    socket.room = room;
                    socket.join(room);
                    rooms[room].push(socket.user_id)
                    console.log('in room ' + accessRoom + ' one socket:' + rooms[accessRoom][0]);
                    console.log(rooms);
                    return;
                }
                
            }
            
            socket.emit('wait', 'not access Tech');
        }
        
        console.log(rooms);
    });   
    
    socket.on('movie', function(movie){
        fs.writeFile('movie/' + generateName() + '.webm', movie, function(err) {
        if(err) {
            console.log("error at save movie: ", err);
            socket.emit('movie', 'error');
        }
      })
    });
      
    //удалить message    
	socket.on('message', function (message) {
		console.log('Got message: ' + message);
        socket.broadcast.to(socket.room).emit('speak_room', message);
	});

	socket.on('speak_room', function (videoFlow) {
        console.log(socket.room);
        socket.broadcast.to(socket.room).emit('speak_room', videoFlow);
	});

    socket.on('chat message', function(msg){
        var user_id = socket.user_id;
        socket.broadcast.to(socket.room).emit('chat message', msg);
        console.log(user_id + ' message ' + msg + ' room : ' + socket.room);
    });
    
    socket.on('closeChat', function() {
       socket.broadcast.to(socket.room).emit("closeChat", socket.user_id);     
    });
    
    socket.on("disconnect", function() {
        socket.broadcast.to(socket.room).emit("leave", socket.user_id);
        
        if (socket.role == 'Tech') {
            delete rooms[socket.room];
        }
        
        delete users[socket.user_id];
    });
        
});

function generateName() {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + "-" + s4() + "-" + s4() + "-" + s4();  
};