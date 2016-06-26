// This is the main file of our chat app. It initializes a new 
// express.js instance, requires the config and routes files
// and listens on a port. Start the application by running
// 'node app.js' in your terminal

var express = require('express'),
    crypto = require('crypto'),
    fs = require('fs'),
    http = require('http'),
    app = express();

var ssl;
try {
    var pathFromRoot = "/etc/letsencrypt/live/cloudex2sh.northeurope.cloudapp.azure.com/";
    var privateKey = fs.readFileSync(pathFromRoot + 'privkey.pem').toString();
    var certificate = fs.readFileSync(pathFromRoot + 'cert.pem').toString();
    var options = {key: privateKey, cert: certificate};
    ssl = (privateKey && certificate);
    if (ssl) {
        console.log("created certificate successfully");
        // console.log({key: privateKey, cert: certificate});
        // console.log(options);
    } else {
        console.log("did not set up certificate!");
    }
} catch (e){
    ssl = false;
}

var port;
var io;

// if successfully set up SSL certificate, open the app on port 443
if (ssl) {
    port = process.env.PORT || 443;

    var https = require('https');
    var server = https.createServer(options, app);
    io = require('socket.io')(server);
    server.listen(port, function() {
        // console.log('Your application is running on https://localhost:' + port);
    });

    require('./config')(app, io);
    require('./routes')(app, io);

    // Redirect from http port 80 to https
    http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(80);

// if SSL is not available, open the app on port 80	
} else {
    port = process.env.PORT || 80;

    io = require('socket.io').listen(app.listen(port));

    require('./config')(app, io);
    require('./routes')(app, io);

    console.log('Your application is running on http://localhost:' + port);
}
