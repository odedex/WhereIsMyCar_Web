/**
 * middleware layer for the gps data database
 */

var MongoClient = require('mongodb').MongoClient;

var gpsDB;
var ready = 0;
var devicesCollection = "registeredDevicesInSystem";

var DIFF_NAME_ERR_MSG = "Please choose a different name";
var DB_DOWN_ERR_MSG = "Database is down";

/**
 * Connect to the database
 */
MongoClient.connect("mongodb://admin:adminadmin@ds040309.mlab.com:40309/wheremycar", function(err, db) {
    if(err) {
        ready = -1;
        console.error(err);
    } else {
        gpsDB = db;
        ready = 1;
        console.log("GPS database ready");
    }
});

/**
 * retrieve all gps data for a single device
 * @param device device id to query
 * @param callback function that accepts a mongo stream object
 * @returns {*}
 */
module.exports.getSingleGPSData = function (device, callback) {
    if (gpsDB) {
        var id = device.id;
        var start = device.startTime;
        var end = device.endTime;
        var stream;
        if (start && start !== "") {
            start = new Date(start);
            if (end && end !== "") {
                end = new Date(end);
                stream = gpsDB.collection(id).find({"date": {"$gte": start, "$lt": end}}).stream();
            } else {
                stream = gpsDB.collection(id).find({"date": {"$gte": start}}).stream();
            }
        } else if (end && end !== "") {
            end = new Date(end);
            stream = gpsDB.collection(id).find({"date": {"$lt": end}}).stream();
        } else {
            stream = gpsDB.collection(id).find().stream();
        }
        return callback(stream);
    } else {
        return callback(null);
    }
};

/**
 * retrieve all devices and their data
 * @param callback function that accepts a dictionary of devices
 * @returns {*}
 */
module.exports.getAllGpsIDs = function (callback) {
    if (gpsDB) {
        gpsDB.listCollections().toArray(function(err, collections) {
            return callback(err, collections);
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};

/**
 * add a single gps entry to a device
 * @param id device id
 * @param entry entry to add
 * @param callback function that accepts a result state of the call
 * @returns {*}
 */
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

/**
 * register a new device to the database
 * @param id id of the new device
 * @param callback optional function that accepts the mongo collection object of the new device
 * @returns {*}
 */
module.exports.registerNewDevice = function (id, callback) {
    if (gpsDB) {
        queryExistingDevice(id, function(err, exists) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
            } else {
                if (exists) {
                    if (callback) {
                        return callback(DIFF_NAME_ERR_MSG);
                    }
                } else {
                    gpsDB.createCollection(id, function(err, collection) {
                        if (callback) {
                            return callback(err, collection);
                        }
                    });
                }
            }
        });
    } else {
        if (callback) {
            return callback(DB_DOWN_ERR_MSG);
        }
    }
};

/**
 * check if a device id exists
 * @param id id to check
 * @param callback function that accepts a boolean
 * @returns {*}
 */
function queryExistingDevice (id, callback) {
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
}
module.exports.queryExistingDevice = queryExistingDevice;


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