var express = require('express'),
    app = express(),
    port = process.env.PORT || 80,
    io = require('socket.io').listen(app.listen(port)),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: '43vg905hn723q0948fmxj091248xunr0971263b502v134978n0',
}));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

require('./config')(app, io);
require('./routes')(app, io);

console.log('Application is running on port ' + port);

