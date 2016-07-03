// Retrieve

var MongoClient = require('mongodb').MongoClient;

var gpsDB;
var ready = 0;
var devicesCollection = "registeredDevicesInSystem";

var DIFF_NAME_ERR_MSG = "Please choose a different name";
var DB_DOWN_ERR_MSG = "Database is down";

/**
 * Connect to the database
 */
MongoClient.connect("mongodb://odedex:odedab17@ds040309.mlab.com:40309/wheremycar", function(err, db) {
    if(err) {
        ready = -1;
        console.error(err);
    } else {
        gpsDB = db;
        ready = 1;
    }
});

module.exports.getSingleGPSData = function (id, socket) {
    if (gpsDB) {
        var stream = gpsDB.collection(id).find().stream();
        stream.on('data', function(doc) {
            socket.emit('newGPSEntry', doc);
        });
        stream.on('error', function(err) {
            socket.emit('newGPSEntryError', err);
        });
        // stream.on('close', function() {
        //     console.log('All done!');
        // });
        stream.on('end', function() {
            socket.existingRequest = false;
        });
    } else {
        return failCallback(DB_DOWN_ERR_MSG);
    }
};

module.exports.getAllGpsIDs = function (callback) {
    if (gpsDB) {
        gpsDB.listCollections().toArray(function(err, collections) {
            return callback(err, collections);
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
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
        return callback(DB_DOWN_ERR_MSG);
    }
};

module.exports.registerNewDevice = function (id, callback) {
    if (gpsDB) {
        gpsDB.createCollection(id, function(err, collection) {
            if (callback) {
                return callback(err, collection);
            }
        });
    } else {
        if (callback) {
            return callback(DB_DOWN_ERR_MSG);
        }
    }
};

module.exports.queryExistingDevice = function (id, callback) {
    if (gpsDB) {
        gpsDB.listCollections().toArray(function(err, collections) {
            if (err){
                return callback(err);
            }
            for (var i = 0 ; i < collections.length ; i += 1) {
                if (collections[i].name === id) {
                    return callback(err, true);
                }
            }
            return callback(err, false);
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
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
        console.log("db is now clear");
    } else {
        console.log("db was not cleared");
    }
};