// Retrieve
var MongoClient = require('mongodb').MongoClient;
var gpsDB;
var ready = 0;

/**
 * Connect to the database
 */
MongoClient.connect("mongodb://odedex:odedab17@ds040309.mlab.com:40309/wheremycar", function(err, db) {
    if(err) {
        ready = -1;
        return console.dir(err);
    } else {
        gpsDB = db;
        ready = 1;
    }
});


function getSingleCollection (id, callback) {
    if (ready === 1) {

        gpsDB.collection(id).find().toArray(function(err, items) {
            callback (err, items);
        })
    } else if (ready === 0){
        console.log("db still not up. retrying...");
        setTimeout(function() {
            getSingleCollection(callback);
        }, 200);
    } else {
        callback("db did not start properly.", null);
    }
}
module.exports.getSingleGPSData = getSingleCollection;


module.exports.printAllGPSData = function (callback) {
    if (gpsDB) {
        gpsDB.listCollections().toArray(function(err, collections) {
            if (err) {
                return callback(err);
            }
            collections.forEach(function(coll) {
                coll.find().toArray(function(err, items) {
                    console.log(items);
                    if (callback) {
                        callback (err, items);
                    }
                })
            })
        });
    } else {
        console.log("db is down");
    }
};


module.exports.addGPSEntry = function (id, entry, callback) {
    if (gpsDB) {
        gpsDB.collection(id).insertOne(entry, {w:1}, function(err, result) {
            if (callback) {
                callback (err, result);
            }
        });
    } else {
        console.log("db is down");
    }
};


/**
 * Checks if the database is up and ready
 * @returns {boolean}
 */
module.exports.isUp = function (){
    return !(ready === 0);
};


/**
 * Clear the database
 */
module.exports.clearDB = function () {
    if (gpsDB) {
        gpsDB.dropDatabase();
        console.log("collection was deleted");
    } else {
        console.log("collection was not deleted");
    }
};