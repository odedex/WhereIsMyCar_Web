module.exports = function (app, io) {

    var gpsdb = require('./gpsdb.js');

    var NO_ID_ERR_MSG = "No such ID\r\n";
    var FAILED_DB_OPER_ERR_MSG = "Database operation failed\r\n";
    var FAILED_DB_WRITE_ERR_MSG = "Failed to write to database\r\n";
    var SUCCESS_DB_WRITE_ERR_MSG = "Write to database was successful\r\n";
    var BAD_UPDATE_FORMAT_ERR_MSG = "bad params. format is /update/:id/:timestamp/:lat/:lng\r\n";
    var BAD_REGISTER_FORMAT_ERR_MSG = "bad params. format is /register/:id\r\n";
    var ID_ALREADY_EXISTS_ERR_MSG = "ID is already in use\r\n";
    var ID_REGISTER_SUCCESS_MSG = "ID successfully registered\r\n";


    app.get('/', function (req, res) {
        // Render views/home.html
        res.render('index');
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
                        gpsdb.registerNewDevice(id, function (registerErr) {
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
        })
    })
};
