/**
 * main application file of the program
 */
var express = require('express'),
    app = express(),
    port = process.env.PORT || 80,
    io = require('socket.io').listen(app.listen(port)),
    session = require('express-session')({
        resave: true, // dont save session if unmodified
        saveUninitialized: true, // dont create session until something stored
        secret: '43vg905hn723q0948fmxj091248xunr0971263b502v134978n0'
    }),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');
    sharedsession = require("express-socket.io-session");

app.use(cookieParser());
app.use(session);

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

io.use(sharedsession(session));

require('./server/config')(app, io);
require('./server/routes')(app, io);

console.log('Application is running on port ' + port);

