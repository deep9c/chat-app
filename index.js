var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);		//initialize a new instance of socket.io by passing the http (the HTTP server) object
var HashMap = require('hashmap');		//import class hashmap
var dl  = require('delivery');				//import delivery (used for file transfer)
var fs  = require('fs');					//import filestream

var usersocketmap = new HashMap();

app.get('/', function(req, res){
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});


io.on('connection', function(socket){		//on connection, create a new 'socket' instance for this particular client
	//socket.broadcast.emit('hi');			//Broadcasting means sending a message to everyone else except for the socket that starts it
	
	socket.on('page load', function(msg){
		usersocketmap.forEach(function(value, key) {
			socket.emit('show connected user', value);
			//console.log(key + " : " + value);
		});
		
	});
	
	socket.on('new user', function(msg){
		usersocketmap.set(socket,msg);		//store uname-socket as key-value pair in map
		io.emit('broadcast new user', msg);
	});
	
	socket.on('chat message', function(msg){
		console.log('message: ' + usersocketmap.get(socket)+":"+msg);
		
		io.emit('chat message', '<b>'+usersocketmap.get(socket)+":</b>"+msg+'<br>');			//io means all the sockets, socket means only connected socket instance
	});
	
	socket.on('send private chat', function(fromId,fromName,toId,toName,msg){
		console.log('send private chat '+toId+'.....'+toName+'....'+msg);
		toSocket = usersocketmap.search(toName);
		toSocket.emit('send private chat',fromId,fromName, toId,toName,msg);
	});
	
	var delivery = dl.listen(socket);
	delivery.on('receive.success',function(file){
	console.log('receive.success called');
    var params = file.params;
    fs.writeFile(file.name,file.buffer, function(err){
      if(err){
        console.log('File could not be saved.');
      }else{
        console.log('File saved.');
      };
    });
  });
	
	socket.on('disconnect', function () {
		//console.log('disconnected '+usersocketmap.get(socket));
		if(usersocketmap.get(socket) != undefined){
			console.log('disconnected user '+usersocketmap.get(socket))
			io.emit('user disconnected',usersocketmap.get(socket));
			usersocketmap.remove(socket);
		}
	});
});