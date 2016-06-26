// This is the main file of our chat app. It initializes a new 
// express.js instance, requires the config and routes files
// and listens on a port. Start the application by running
// 'node app.js' in your terminal

var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    app = express();


var port;
var io;

// if SSL is not available, open the app on port 80
port = process.env.PORT || 80;

io = require('socket.io').listen(app.listen(port));

require('./config')(app, io);
require('./routes')(app, io);

console.log('Your application is running on port' + port);

