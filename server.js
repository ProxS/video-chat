var static = require('node-static');
var https = require('http');
var fs = require("fs");

var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'log.log'}
  ]
});

var logger = log4js.getLogger();

var file = new(static.Server)();

var httpsOptions = [];
var rooms = {};

var app = https.createServer(function (req, res) {
	
    file.serve(req, res);
    
    req.on('data', function(data) {
        
        data = data.toString();
        var base64Data = data.replace(/^data:image\/jpeg;base64,/, "");

        fs.writeFile('img/' + generateName() + ".jpeg", base64Data, 'base64', function(err) {
            if (err) {
                logger.info(err);
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
            io.sockets.emit('check', true);
            socket.room = room;
            socket.join(room);
        } else if (role == 'User') {
            
            for(var accessRoom in rooms) {
                
                if (rooms[accessRoom].length == 1) {
                    var room = accessRoom;
                    socket.room = room;
                    socket.join(room);
                    rooms[room].push(socket.user_id);
                    logger.info(rooms);
                    logger.info('in room ' + accessRoom + ' one socket:' + socket.user_id);
                    socket.broadcast.to(socket.room).emit('call');
                    socket.emit('room', socket.room);
                    return;
                }
                
            }
            socket.emit('wait', 'not access Tech');
        }
        logger.info(rooms);
    });   
    
    socket.on('check', function(){
        
        for(var accessRoom in rooms) {
           if (rooms[accessRoom].length == 1) {
                socket.emit('check', true);       
           } 
        }
    });
    
//    socket.on('call', function(call){
//         socket.broadcast.to(socket.room).emit('call', call);
//    });
    
    socket.on('movie', function(movie){
        fs.writeFile('movie/' + generateName() + '.webm', movie, function(err) {
        if(err) {
            logger.info("error at save movie: ", err);
            socket.emit('movie', 'error');
        }
      })
    });
      
    //удалить message    
	socket.on('message', function (message) {
		logger.info('Got message: ' + message);
        socket.broadcast.to(socket.room).emit('speak_room', message);
	});

	socket.on('speak_room', function (videoFlow) {
        socket.broadcast.to(socket.room).emit('speak_room', videoFlow);
	});

    socket.on('chat message', function(msg){
        var user_id = socket.user_id;
        socket.broadcast.to(socket.room).emit('chat message', msg);
        logger.info(user_id + ' message ' + msg + ' room : ' + socket.room);
    });
    
    socket.on('closeChat', function() {
       socket.broadcast.to(socket.room).emit("closeChat", socket.user_id);     
    });
    
    socket.on("disconnect", function() {
        socket.broadcast.to(socket.room).emit("closeChat", socket.user_id);
        
        if(socket.room !== undefined && rooms[socket.room] !== undefined) {
            
            var index = rooms[socket.room].indexOf(socket.user_id);
            
            if (socket.role == 'Tech') {
                delete rooms[socket.room].splice(index, 2);;
            } else {
                delete rooms[socket.room].splice(index, 1);    
            }
        }
        for(var room in rooms) {
            if (rooms[room].length == 0) {
                delete rooms[room];
            }
        }
        
        logger.info(rooms);
    });
        
});

function generateName() {
    var s4 = function() {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + "-" + s4() + "-" + s4() + "-" + s4();  
};