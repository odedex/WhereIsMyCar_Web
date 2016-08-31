/**
 * middleware layer for the users data database
 */

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

/**
 * get all devices registered to a user
 * @param id id of the user
 * @param callback function that receives an array of devices
 * @returns {*}
 */
module.exports.getUserDevices = function (id, callback) {
    if (usersDB) {
        usersDB.collection(id).find().toArray(function (err, items) {
            if (items) {
                return callback(items[0].devices);
            }
            return callback(null);
        });
    } else {
        return callback(null);
        // return callback(DB_DOWN_ERR_MSG);
    }
};

/**
 * register a new user to the database
 * @param query user object to register
 * @param callback optional function that receives the mongo collection created by the database
 * @returns {*}
 */
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
                        });
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
 * add a given device to a given user
 * @param user user to add the device to
 * @param device device to add
 * @param callback optional function that receives the result of the database action
 * @returns {*}
 */
module.exports.addDeviceToUser = function (user, device, callback) {
    if (usersDB) {
        queryUser({user: user}, function(err, exists) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
            } else if (exists >= 0 ) {
                // var deviceobj = {"name":device.name.toString(), "id":device.id.toString()};
                //TODO: THE SERVER ALSO NEEDS TO ADD THE DEVICE TO THE DEVICES DB
                usersDB.collection(user).updateOne({}, {"$push":{"devices":device}}, {w:1}, function(err, res) {
                    if (callback) {
                        return callback(err, res);
                    }
                });
            } else {
                if (callback) {
                    return callback("No such user found");
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
 * function that translate a given device name to the ID of the device
 * @param username string of the user the device is tied to
 * @param deviceName the name of the device the user registered
 * @param callback function that receives the ID of the device
 * @returns {*}
 */
module.exports.deviceNameToID = function(username, deviceName, callback) {
    if (usersDB) {
        usersDB.collection(username).find({"devices.name" : deviceName}, {"devices.$": 1}).toArray(function (err, items) {
            if (err) {
                return callback(err);
            } else {
                if (items.length > 0) {
                    return callback (err, items[0].devices[0].id);
                } else {
                    return callback("No such name");
                }
            }
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};

/**
 * function that translates a device ID to the name the user gave it while registering
 * @param username string of the user the device is tied to
 * @param deviceID ID of the queried device
 * @param callback function that receives the name of the device
 * @returns {*}
 */
module.exports.deviceIDToName = function(username, deviceID, callback) {
    if (usersDB) {
        usersDB.collection(username).find({"devices.id" : deviceID}, {"devices.$": 1}).toArray(function (err, items) {
            if (err) {
                return callback(err);
            } else {
                if (items.length > 0) {
                    return callback (err, items[0].devices[0].name);
                } else {
                    return callback("No such id");
                }
            }
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};

/**
 * checks if a given device name is already taken for a given user
 * @param username string of the user name
 * @param deviceName string of the name to query
 * @param callback function that receives a boolean
 * @returns {*}
 */
module.exports.isNameTaken = function(username, deviceName, callback) {
    if (usersDB) {
        usersDB.collection(username).find({"devices.name" : deviceName}, {"devices.$": 1}).toArray(function (err, items) {
            if (err) {
                return callback(err);
            } else {
                if (items.length > 0) {
                    return callback (err, true);
                } else {
                    return callback(err, false);
                }
            }
        });
    } else {
        return callback(DB_DOWN_ERR_MSG);
    }
};

/**
 * check if a username + password combination exists in the database
 * @param query username and password object
 * @param callback function that receives a number representing the response
 * @returns {*} 1 on user&pass match, 0 for only user match, -1 for no match
 */
function queryUser (query, callback) {
    if (usersDB) {
        usersDB.collection(query.user).find().toArray(function(err, items) {
            if (err || items.length === 0) {
                return callback(null, -1); // no username or password
            }
            if (items[0].pass === query.pass) {
                return callback(null, 1); // username match and password match
            } else {
                return callback(null, 0); // username match but no password match
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