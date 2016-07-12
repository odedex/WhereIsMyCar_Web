// Retrieve

var MongoClient = require('mongodb').MongoClient;

var usersDB;
var ready = 0;

var DIFF_NAME_ERR_MSG = "Please choose a different name";
var DB_DOWN_ERR_MSG = "Database is down";

/**
 * Connect to the database
 */
MongoClient.connect("mongodb://usersadmin:admin@ds040349.mlab.com:40349/wheremycarusers", function(err, db) {
    if(err) {
        ready = -1;
        console.error(err);
    } else {
        usersDB = db;
        ready = 1;
        console.log("Users database ready");
    }
});

module.exports.getSingleGPSData = function (id, socket) {
    if (usersDB) {
        var stream = usersDB.collection(id).find().stream();
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
            socket.emit('newGPSEntryEnd');
        });
    } else {
        return failCallback(DB_DOWN_ERR_MSG);
    }
};

module.exports.getAllGpsIDs = function (callback) {
    if (usersDB) {
        usersDB.listCollections().toArray(function(err, collections) {
            return callback(err, collections);
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};


module.exports.addGPSEntry = function (id, entry, callback) {
    if (usersDB) {
        usersDB.collection(id).insertOne(entry, {w:1}, function(err, result) {
            if (callback) {
                return callback (err, result);
            }
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};

module.exports.registerNewUser = function (query, callback) {
    if (usersDB) {
        queryUser(query, function(err, exists) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
            } else {
                if (exists >= 0) {
                    if (callback) {
                        return callback(DIFF_NAME_ERR_MSG);
                    }
                } else {
                    usersDB.createCollection(query.user, function(err, collection) {
                        collection.insertOne({"pass":query.pass}, {w:1}, function(err, result) {
                            if (callback) {
                                return callback(err, collection);
                            }
                        })
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
 * 
 * @param query
 * @param callback
 * @returns {*} 1 on user&pass match, 0 for only user match, -1 for no match
 */
function queryUser (query, callback) {
    var founduser = false;
    if (usersDB) {
        usersDB.collection(query.user).find().toArray(function(err, items) {
            if (err || items.length === 0) {
                return callback(null, -1);
            }
            if (items[0].pass === query.pass) {
                founduser = true;
                return callback(null, 1);
            } else {
                return callback(null, 0);
            }
        });
    } else {
        return callback(DB_DOWN_ERR_MSG, -1);
    }
}
module.exports.queryExistingUser = queryUser;


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
    if (usersDB) {
        usersDB.dropDatabase();
        console.log("db is now clear");
    } else {
        console.log("db was not cleared");
    }
};