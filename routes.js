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


    app.get('/update/:id/:timestamp/:lat/:lng', function (req, res) {
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
                        gpsdb.addGPSEntry(id, {date:timestamp, lat: lat, lng: lng}, function(err) {
                            if (err) {
                                res.status(500).send(FAILED_DB_OPER_ERR_MSG + err.toString());
                            } else {
                                res.status(200).send(SUCCESS_DB_WRITE_ERR_MSG);
                            }
                        })
                    }
                }
            })

        } else {
            res.status(400).send(BAD_UPDATE_FORMAT_ERR_MSG);
        }
    });

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
        socket.on('queryGPSID', function (id) {
            gpsdb.queryExistingDevice(id, function (existsErr, exists) {
                if (exists) {
                    gpsdb.getSingleGPSData(id, function(err, data) {
                        if (!err) {
                            data.sort(function(a,b) {
                                return new Date(a.date) - new Date(b.date);
                            });
                        }
                        socket.emit('queryGPSIDResponse', {err: err, data: data});
                    });
                } else {
                    socket.emit('queryGPSIDResponse', {err: NO_ID_ERR_MSG});
                }
            });
        })
    })
};
