/**
 * main routing configuration of the server.
 * contains socket listeners and emitters in addition to express routes
 * @param app
 * @param io
 */
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
    var BAD_CREDS_ERR_MSG = "Wrong username or password\r\n";
    var ID_NOT_YET_PENDING_MSG = "No such id is pending registration\r\n";
    var DEVICE_PENDING_MSG = "Device pending confirmation\r\n";
    var DEVICE_NAME_TAKEN_MSG = "Device name already in use\r\n";
	var ALPHANUMERIC_ERR_MSG = "Please use only numbers and characters\r\n";

    var waitingDevices = {}; // deviceID -> requesting_user, name
    var sessions = {}; // token -> username, time
    var SESSION_TTL = 20*60*1000;

	/**
	 * check if a given session is within the valid time to live window.
	 * updates the session timestamp if it is valid, refreshing the window
	 * @param token token of the session to validate
	 * @returns {boolean} true iff the session window is valid
	 */
    function validateSession(token) {
        if (token) {
            var session = sessions[token];
            if (session) {
            	var nowTime = new Date();
                if (nowTime - session.time < SESSION_TTL) {
                    sessions[token] = {time: nowTime, user: session.user};
                    return true;
                } else {
                    delete sessions[token];
                }
            }
        }
        return false;
    }

	/**
	 * redirect to /login page
	 */
	app.get('/', function (req, res) {
        if (validateSession(req.session.token)) {
            res.redirect('/devices');
        } else {
            res.render('login');
        }
    });

	/**
	 * redirect to /devices page
	 */
    app.get('/devices', function(req, res) {
        if (validateSession(req.session.token)) {
            if (req.session.device) {
                delete req.session.device;
            }
            res.render('devices');
        } else {
            res.redirect('../');
        }
    });

	/**
	 * redirect to /gpsmap page
	 */
    app.get('/gpsmap', function(req, res) {
        if (validateSession(req.session.token) && req.session.device) {
            res.render('gpsmap');
        } else {
            res.redirect('../');
        }
    });

	/**
	 * post function for logging in
	 */
    app.post('/loginuser', function(req, res) {
        var user = req.body.user,
            pass = req.body.pass;
        if (isAlphanumeric(user) && isAlphanumeric(pass)) {
            var query = {user: user, pass: pass};
            usersdb.queryExistingUser(query, function(err, valid) {
                if (valid === 1) {
                    var token;
                    do {
                        token = generateSession(user);
                    } while (sessions[token]);
                    sessions[token] = { time:new Date(),
                                        user:user};
                    req.session.token = token;

                    res.send({redirect: '/devices'});
                } else {
                    res.send({setErrMsg: BAD_CREDS_ERR_MSG});
                }
            });
        } else {
            res.send({setErrMsg: ALPHANUMERIC_ERR_MSG});
        }
    });

	/**
	 * post function for registering a new user
	 */
    app.post('/registeruser', function(req, res) {
        var user = req.body.user,
            pass = req.body.pass;
        if (isAlphanumeric(user) && isAlphanumeric(pass)) {
            var query = {user: user, pass: pass};
            usersdb.registerNewUser(query, function(err) {
                if (err) {
                    res.send({setErrMsg: err.toString()});
                } else {
                    var token;
                    do {token = generateSession(user);} while (sessions[token]);
                    sessions[token] = {time:new Date(), user:user};
                    req.session.token = token;

                    res.send({redirect: '/devices'});
                }
            });
        }
    });

	/**
	 * post function for logging out
	 */
    app.post('/logoutuser', function(req, res) {
        var token = req.session.token;
        if (token && sessions[token]) {
            delete sessions[token];
            delete req.session.token;
            res.send({redirect:'/'});
        } else {
            res.send({redirect:'/'});
        }
    });

	/**
	 * post function for listening to a new device
	 * server writes the device to the user's session
	 */
    app.post('/listendevice', function(req, res) {
        if (validateSession(req.session.token)) {
            var device = req.body.device;
            if (device) {
                var token = req.session.token;
                var user = sessions[token].user;
                usersdb.deviceNameToID(user, device, function(err, deviceId) {
                    var start = req.body.startTime;
                    var end = req.body.endTime;
                    req.session.device = {id: deviceId, name: device, startTime:start, endTime:end};
                    res.send({redirect:'/gpsmap'});
                });
            } else {
                res.send({redirect:'/devices'});
            }
        } else {
            res.send({redirect:'/'});
        }
    });

	/**
	 * post function for the user to register a new device
	 */
    app.post('/registrdevicetouser', function(req, res) {
        if (validateSession(req.session.token)) {
            var name = req.body.name,
                id = req.body.id;
            if (isAlphanumeric(name) && isAlphanumeric(id)) {
                var token = req.session.token;
                var user = sessions[token].user;

                usersdb.isNameTaken(user, name, function(err, isTaken) {
                    if (err) {
                        res.send({setErrMsg: err.toString()});
                    } else {
                        if (isTaken) {
                            res.send({setErrMsg: DEVICE_NAME_TAKEN_MSG});
                        } else {
                            waitingDevices[id] = {user:user, name:name};
                            // console.log(waitingDevices);
                            res.send({setErrMsg: DEVICE_PENDING_MSG});
                        }
                    }
                });
            }
        } else {
            res.send({redirect:'/'});
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
                    res.send(FAILED_DB_OPER_ERR_MSG + err.toString());
                } else {
                    if (!exists) {
                        res.send(FAILED_DB_WRITE_ERR_MSG + NO_ID_ERR_MSG);
                    } else {
                        var entry = {date:new Date(timestamp), lat: lat, lng: lng};
                        gpsdb.addGPSEntry(id, entry, function(err) {
                            if (err) {
                                res.send(FAILED_DB_OPER_ERR_MSG + err.toString());
                            } else {
                                res.send(SUCCESS_DB_WRITE_ERR_MSG);

                                // Live update sockets that listen to that same ID.
                                for (var socketKey in io.sockets.connected) {
                                    if (io.sockets.connected.hasOwnProperty(socketKey)) {
                                        var socket = io.sockets.connected[socketKey];
                                        if (socket.handshake && socket.handshake.device) {
                                            var socketDeviceID = socket.handshake.session.device.id;
                                            var socketDeviceEndTime = socket.handshake.session.device.endTime;
                                            if (socketDeviceID === id && (socketDeviceEndTime === "" || (!socketDeviceEndTime))) {
                                                socket.emit('newGPSEntryLive', entry);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        } else {
            res.send(BAD_UPDATE_FORMAT_ERR_MSG);
        }
    });

    /**
     * Register a new device to the database
     */
    app.get('/register/:id', function (req, res) {
        var id = req.params.id;
        if (id) {
            if (!waitingDevices[id]) {
                res.send(ID_NOT_YET_PENDING_MSG);
            } else {
                gpsdb.queryExistingDevice(id, function(err, exists) {
                    if (err) {
                        res.send(FAILED_DB_OPER_ERR_MSG + err.toString());
                    } else {
                        if (exists) {
                            delete waitingDevices[i];
                            res.send(ID_ALREADY_EXISTS_ERR_MSG);
                        } else {

                            generateUniqueDeviceKey(id, function(deviceKey) {
                                gpsdb.registerNewDevice(deviceKey, function(err) {
                                    if (err) {
                                        res.send(FAILED_DB_OPER_ERR_MSG + err.toString());
                                    } else {
                                        var user = waitingDevices[id].user;
                                        var device = {name: waitingDevices[id].name, id:deviceKey};
                                        usersdb.addDeviceToUser(user, device, function (err) {
                                            if (err) {
                                                //TODO: probably need to also revert the addition of the device to gpsdb
                                                res.send(FAILED_DB_OPER_ERR_MSG + err.toString());
                                            } else {
                                                var reqUser = waitingDevices[id].user;
                                                // Live update socket to reflect the new device.
                                                for (var socketKey in io.sockets.connected) {
                                                    if (io.sockets.connected.hasOwnProperty(socketKey)) {
                                                        var socket = io.sockets.connected[socketKey];
                                                        var sockUser = sessions[socket.handshake.session.token].user;
                                                        if (reqUser === sockUser) {
                                                            socket.emit('populateDevice', device.name);
                                                            socket.emit('setMsg');
                                                        }
                                                    }
                                                }
                                                delete waitingDevices[id];
                                                res.send(deviceKey);
                                            }
                                        });
                                    }
                                });
                            });

                        }
                    }
                });
            }
        } else {
            res.send(BAD_REGISTER_FORMAT_ERR_MSG);
        }
    });

	/**
	 * define all socket events of the server
	 */
    io.on('connection', function(socket) {
        socket.existingRequest = false;

		/**
		 * define a socket listen event for requesting all gps data for a device
		 */
		socket.on('queryGPSDataBulk', function () {
            var device = socket.handshake.session.device;
            var deviceID = device.id;
            var deviceName = device.name;
            var token = socket.handshake.session.token;
            var user = sessions[token].user;

            socket.emit('deviceName', deviceName);

            gpsdb.queryExistingDevice(deviceID, function (existsErr, exists) {
                if (exists && !socket.existingRequest) {
                    socket.existingRequest = true;
                    gpsdb.getSingleGPSData(device, function(stream) {
                        stream.on('data', function(doc) {
                            socket.emit('newGPSEntryBulk', doc);
                        });
                        stream.on('error', function(err) {
                            socket.emit('newGPSEntryBulkError', err);
                        });
                        stream.on('end', function() {
                            socket.existingRequest = false;
                            socket.emit('newGPSEntryBulkEnd');
                        });
                    });
                } else {
                    socket.emit('newGPSEntryError', {err: NO_ID_ERR_MSG});
                }
            });
        });

		/**
		 * define a socket listen event for requesting all devices for a user
		 */
		socket.on('populateDevicesRequest', function() {
            var token = socket.handshake.session.token;
            usersdb.getUserDevices(sessions[token].user, function(deviceArray) {
                if (deviceArray) {
                    deviceArray.forEach(function(deviceID) {
                        socket.emit('populateDevice', deviceID.name);
                    });
                }
            });
        });
    });

	/**
	 * generate a new device id hash that does not yet exist in the database
	 * @param id of the device
	 * @param callback function that receives the new device id
	 */
    function generateUniqueDeviceKey(id, callback) {
        var newDeviceKey = sha256(id);
        gpsdb.queryExistingDevice(newDeviceKey, function(err, exists) {
            if (exists) {
                generateUniqueDeviceKey(id, callback);
            } else {
                callback(newDeviceKey);
            }
        });
    }
};

/**
 * check if a given string contains only characters and numbers
 * @param string string to check
 * @returns {boolean} true iff the string contains only characters and numbers
 */
function isAlphanumeric(string){
    if (!string) {
        return false;
    }
    return (/^[a-z0-9]+$/i.test( string ));
}

var sha256 = require('js-sha256');
/**
 * generate a session hash
 * @param username string of the user
 */
function generateSession(username) {
    var date = new Date();
    return (sha256(username + date.toString() + Math.random().toString()));
}
