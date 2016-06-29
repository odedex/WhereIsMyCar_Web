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
        return console.error(err);
    } else {
        gpsDB = db;
        ready = 1;
    }
});

module.exports.getSingleGPSData = function (id, callback) {
    if (gpsDB) {
        gpsDB.collection(id).find().toArray(function(err, items) {
            return callback (err, items);
        })
    } else {
        return callback("db did not start properly.", null);
    }
};

module.exports.getAllGPSData = function (callback) {
    if (gpsDB) {
        gpsDB.listCollections().toArray(function(err, collections) {
            if (err) {
                return callback(err, collections);
            }
        });
    } else {
        return callback("db is down", null);
    }
};


module.exports.addGPSEntry = function (id, entry, callback) {
    if (gpsDB) {
        gpsDB.collection(id).insertOne(entry, {w:1}, function(err, result) {
            if (callback) {
                return callback (err, result);
            }
        });
    } else {
        return callback("db is down", null);
    }
};


/**
 * Check if db is up and ready
 * @returns {number} 0 if not yet init, -1 if init failed, 1 if up and ready
 */
module.exports.isUp = function (){
    return ready;
};


/**
 * Clear the database
 */
module.exports.clearDB = function () {
    if (gpsDB) {
        gpsDB.dropDatabase();
        console.log("db is now cleared");
    } else {
        console.log("db was not cleared");
    }
};