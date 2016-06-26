// Retrieve
var MongoClient = require('mongodb').MongoClient;
var gamesdb;
var collection;
var ready = 0;

/**
 * Connect to the database
 */
MongoClient.connect("mongodb://13.69.82.120:27017/example_db", function(err, db) {
    if(err) {
        ready = -1;
        return console.dir(err);
    } else {
        gamesdb = db;
        collection = db.collection('test');
        ready = 1;
    }
});

/**
 * Get all games from the database
 * @param callback
 */
function getGames (callback) {
    if (ready === 1) {
        collection.find().toArray(function(err, items) {
            callback (err, items);
        })
    } else if (ready === 0){
        console.log("db still not up, could not retrieve games. retrying...");
        setTimeout(function() {
            getGames(callback);
        }, 200);
    } else {
        callback("db did not start properly. could not retrieve games", null);
    }
}
module.exports.getAllGames = getGames;

/**
 * Print all games in the database
 * @param collection
 * @param callback
 */
function printCollection (collection, callback) {
    if (collection) {
        collection.find().toArray(function(err, items) {
            console.log(items);
            if (callback) {
                callback(err, items);
            }
        });
    } else {
        console.log("db is down");
    }
}

/**
 * Print all games in the database
 * @param callback
 */
module.exports.printGames = function(callback) {
    printCollection(collection, callback);
};

module.exports.addGame = function (game, callback) {
    if (collection) {
        collection.insert(game, {w:1}, function(err, result) {
            if (callback) {
                callback (err, result);
            }
        });
    } else {
        console.log("db is down");
    }

};

/**
 * Delete a game from the database
 * @param id
 * @param callback
 */
module.exports.deleteGame = function (id, callback) {
    if (collection) {
        collection.remove({gameID:id}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

/**
 * Add a single message to a game in the database
 * @param id
 * @param msg
 * @param callback
 */
module.exports.addMsgToGame = function (id, msg, callback) {
    if (collection) {
        collection.update({gameID:id}, {$push:{messages:msg}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

/**
 * Update the current turn to a player in a game
 * @param id
 * @param player
 * @param usernames
 * @param callback
 */
module.exports.setCurTurn = function (id, player, usernames, callback) {
    if (collection) {
        collection.update({gameID:id}, {$set:{curTurn:player, players: usernames}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

/**
 * Add a new player to a game
 * @param id
 * @param player
 * @param callback
 */
module.exports.addPlayerToGame = function (id, player, callback) {
    if (collection) {
        collection.update({gameID:id}, {$push:{players:player}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
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
 * Delete a player from a game
 * @param id
 * @param player
 * @param callback
 */
module.exports.delPlayerFromGame = function (id, player, callback) {
    if (collection) {
        collection.update({gameID:id}, {$pull:{players:player}}, {w:1}, function(err, result) {
            if (callback) {
                callback(err, result);
            }
        })
    } else {
        console.log("db is down");
    }
};

/**
 * Clear the database
 */
function clearDB() {
    if (collection) {
        collection.remove();
        console.log("collection was deleted");
    } else {
        console.log("collection was not deleted");
    }
}

module.exports.clearDB = clearDB;