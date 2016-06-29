module.exports = function (app, io) {

    var gpsdb = require('./gpsdb.js');


    app.get('/', function (req, res) {
        // Render views/home.html
        res.render('index');
    });


    app.get('/update/:id/:timestamp/:lat/:lng', function (req, res) {
        console.log("write request");
        var id = req.params.id,
            timestamp = req.params.timestamp,
            lat = req.params.lat,
            lng = req.params.lng;
        if (id && timestamp && lat && lng) {
            gpsdb.addGPSEntry(id, {date:timestamp, lat: lat, lng: lng}, function(err) {
                if (err) {
                    console.error(err);
                    res.write("Failed to write to database");
                    res.end();
                } else {
                    res.write("Write to database was successful");
                    res.end();
                }
            })
        } else {
            res.write("bad params. format is /update/:id/:timestamp/:lat/:lng");
            res.end();
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
            gpsdb.getSingleGPSData(id, function(err, data) {
                if (!err) {
                    data.sort(function(a,b) {
                        return new Date(a.date) - new Date(b.date);
                    });
                }
                socket.emit('queryGPSIDResponse', {err: err, data: data});
            });
        })
    })
};
