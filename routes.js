module.exports = function (app, io) {

    var gpsdb = require('./gpsdb.js');
    var usersdb = require('./usersdb');

    var NO_ID_ERR_MSG = "No such ID\r\n";
    var FAILED_DB_OPER_ERR_MSG = "Database operation failed\r\n";
    var FAILED_DB_WRITE_ERR_MSG = "Failed to write to database\r\n";
    var SUCCESS_DB_WRITE_ERR_MSG = "Write to database was successful\r\n";
    var BAD_UPDATE_FORMAT_ERR_MSG = "bad params. format is /update/:id/:timestamp/:lat/:lng\r\n";
    var BAD_REGISTER_FORMAT_ERR_MSG = "bad params. format is /register/:id\r\n";
    var ID_ALREADY_EXISTS_ERR_MSG = "ID is already in use\r\n";
    var ID_REGISTER_SUCCESS_MSG = "ID successfully registered\r\n";
    var BAD_CREDS_ERR_MSG = "Wrong username or password";

    var sessions = {};
    var SESSION_TTL = 20*60*1000;


    app.get('/', function (req, res) {
        if (sessions[req.session.token]) {
            //todo: add check that session is up to date
            //todo: update session time
            res.status(303).redirect('/devices');
        } else {
            // Render views/home.html
            res.status(200).render('login');
        }
    });

    app.get('/devices', function(req, res) {
        if (sessions[req.session.token]) {
            res.status(200).render('devices');
        } else {
            res.status(403).redirect('../');
        }
        //TODO: populate the window using sockets
    });

    
    app.post('/loginuser', function(req, res) {

        console.log("attempting login");
        var user = req.body.user,
            pass = req.body.pass;
        if (isAlphanumeric(user) && isAlphanumeric(pass)) {
            var query = {user: user, pass: pass};
            usersdb.queryExistingUser(query, function(err, valid) {
                if (valid === 1) {
                    // console.log("valid");
                    //TODO: set session
                    var token;
                    do {token = generateSession(user);} while (sessions[token]);
                    sessions[token] = {time:new Date(), user:user};
                    req.session.token = token;

                    res.send({ redirect: '/devices' });
                } else {
                    res.send({err:BAD_CREDS_ERR_MSG});
                }
            })
        }
    });

    app.post('/registeruser', function(req, res) {
        console.log("attempting register");
        var user = req.body.user,
            pass = req.body.pass;
        if (isAlphanumeric(user) && isAlphanumeric(pass)) {
            var query = {user: user, pass: pass};
            usersdb.registerNewUser(query, function(err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("registered new user!");
                    //TODO: set session
                    res.redirect('/devices');
                }
            })
        }
    });
    

    /**
     * Add a new gps entry to an existing device
     */
    //TODO: future work - add support to make sure only the device can register new data for itself
    app.get('/update/:id/:timestamp/:lat/:lng', function (req, res) {
        // Parse the input
        var id = req.params.id,
            timestamp = req.params.timestamp,
            lat = req.params.lat,
            lng = req.params.lng;
        if (id && timestamp && lat && lng) {
            gpsdb.queryExistingDevice(id, function(err, exists) {
                if (err) {
                    res.status(500).send(FAILED_DB_OPER_ERR_MSG + err.toString());
                } else {
                    if (!exists) {
                        res.status(400).send(FAILED_DB_WRITE_ERR_MSG + NO_ID_ERR_MSG);
                    } else {
                        var entry = {date:timestamp, lat: lat, lng: lng};
                        gpsdb.addGPSEntry(id, entry, function(err) {
                            if (err) {
                                res.status(500).send(FAILED_DB_OPER_ERR_MSG + err.toString());
                            } else {
                                res.status(200).send(SUCCESS_DB_WRITE_ERR_MSG);

                                // Live update sockets that listen to that same ID.
                                for (var socketKey in io.sockets.connected) {
                                    if (io.sockets.connected.hasOwnProperty(socketKey)) {
                                        var socket = io.sockets.connected[socketKey];
                                        if (socket.listeningTo === id) {
                                            socket.emit('newGPSEntry', entry);
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        } else {
            res.status(400).send(BAD_UPDATE_FORMAT_ERR_MSG);
        }
    });

    /**
     * Register a new device to the database
     */
    //TODO: future work - implement functionality that avoids fake devices
    app.get('/register/:id', function (req, res) {
        var id = req.params.id;
        if (id) {
            gpsdb.queryExistingDevice(id, function(err, exists) {
                if (err) {
                    res.status(500).send(FAILED_DB_OPER_ERR_MSG + err.toString());
                } else {
                    if (exists) {
                        res.status(400).send(ID_ALREADY_EXISTS_ERR_MSG);
                    } else {
                        gpsdb.registerNewUser(id, function (registerErr) {
                            if (registerErr) {
                                res.status(500).send(FAILED_DB_OPER_ERR_MSG + registerErr.toString());
                            } else {
                                res.status(200).send(ID_REGISTER_SUCCESS_MSG);
                            }
                        })
                    }
                }
            })
        } else {
            res.status(400).send(BAD_REGISTER_FORMAT_ERR_MSG);
        }
    });
    
    //TODO: http://stackoverflow.com/questions/1140189/converting-latitude-and-longitude-to-decimal-values
    //TODO: update this
    function ParseDMS(input) {
        var parts = input.split(/[^\d\w]+/);
        var lat = ConvertDMSToDD(parts[0], parts[1], parts[2], parts[3]);
        var lng = ConvertDMSToDD(parts[4], parts[5], parts[6], parts[7]);
    }

    //TODO: update this
    function ConvertDMSToDD(degrees, minutes, seconds, direction) {
        var dd = degrees + minutes/60 + seconds/(60*60);

        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        } // Don't do anything for N or E
        return dd;
    }

    var gpsio = io.on('connection', function(socket) {

        socket.existingRequest = false;
        //TODO: there may be a bug where 'existingRequest' member is ignored (replicate by spamming 'enter' on input)

        socket.on('queryGPSID', function (id) {
            gpsdb.queryExistingDevice(id, function (existsErr, exists) {
                if (!exists) {
                    socket.listeningTo = undefined;
                }
                if (exists && !socket.existingRequest) {
                    socket.existingRequest = true;
                    socket.listeningTo = id;
                    gpsdb.getSingleGPSData(id, socket);


                    // gpsdb.getSingleGPSData(id, function(err, data) {
                    //     if (!err) {
                    //         data.sort(function(a,b) {
                    //             return new Date(a.date) - new Date(b.date);
                    //         });
                    //     }
                    //     socket.emit('queryGPSIDResponse', {err: err, data: data});
                    // });
                } else {
                    socket.emit('newGPSEntryError', {err: NO_ID_ERR_MSG});
                }
            });
        });

        socket.on('doLogin', function(data) {
            console.log(data);
        })
    })
};

function isAlphanumeric(string){
    return (/^[a-z0-9]+$/i.test( string ));
}

function generateSession(username) {
    var sha1 = require('sha1');
    var date = new Date();
    return (sha1(username + date.toString() + Math.random().toString()));
}