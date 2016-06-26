


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
        }
    });
};
