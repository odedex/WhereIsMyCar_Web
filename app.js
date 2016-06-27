var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    app = express();
    port = process.env.PORT || 80;
    io = require('socket.io').listen(app.listen(port));

require('./config')(app, io);
require('./routes')(app, io);

console.log('Application is running on port ' + port);

