// Setup basic express server
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var cookies = require( "cookies" );
var bodyParser = require('body-parser');
var ejs = require('ejs');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var session = require('express-session');
//var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});
app.engine('.html', ejs.__express);
app.set('view engine', 'html');// app.set('view engine', 'ejs');
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));
app.use(express.favicon());
app.use(express.bodyParser());
app.use(cookieParser());
app.use(express.methodOverride());
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index');
});
var users = {};
var usernum = 0;
var Cookies;

app.post('/login',urlencodedParser,function(req,res){
	var username = req.body.username;
	users[username] = username;
  Cookies = new cookies(req,res);
	Cookies.set("username",username,{ httpOnly: false });
	usernum++;
	res.redirect('/chat');
});

app.get('/chat',function(req,res){
	console.log(req.cookies.username);
	res.render('chat.html');
});
//socketio
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
