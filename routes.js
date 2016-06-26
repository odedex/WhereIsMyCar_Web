

var game = require('./game.js');
var turnLen = 120;

module.exports = function (app, io) {

    var gamesdb = require('./gamesdb.js');
    var games = {};

    /**
     * Populate the local games object with games from the database
     */
    function getGames() {
        gamesdb.getAllGames(function (err, result) {
            if (err) {
                console.log(err);
                games = {};
            } else {
                games = {};
                result.forEach(function (data) {
                    games[data.gameID] = new game.game(data.gameID, data.curTurn, data.maxLines, data.messages, data.players);
                });

                console.log("got all games from the database");
            }
        });
    }
    getGames();

    /**
     * Delete a player from a game
     * @param id
     * @param username
     */
    function removePlayerFromGame(id, username) {
        if (games[id]) {
            if (!games[id].removePlayer(username)) {
                delete games[id.toString()];
                gamesdb.deleteGame(id, function () {/*gamesdb.printGames();*/});
            } else {
                gamesdb.delPlayerFromGame(id, username, function () {/*gamesdb.printGames();*/})
            }
        }
    }

    /**
     * Advance the turn of a game
     * @param gameio
     * @param id
     * @param turnUser
     */
    function nextTurn(gameio, id, turnUser) {

        if (!games[id]){
            console.log("game " + id.toString() + " not in the db. killing turns");
            return;
        }

        var room = findClientsSocket(io, id);
        var curruser = games[id].curTurn;

        var players = games[id].players;
        var onlineusernames = [];
        for (var i = 0; i < room.length; i++) {
            onlineusernames.push(room[i].username);
        }
        var nextUser = "";
        var currIndex = players.indexOf(curruser);

        for (var i = 1; i <= players.length; i++) {
            nextUser = players[(currIndex + i) % players.length];
            if (onlineusernames.indexOf(nextUser) != -1) {
                break;
            } else {
                removePlayerFromGame(id, nextUser);
                nextUser = undefined;
            }
        }

        if (nextUser == undefined) {
            console.log("no one is online, killing next turn timer");
            return;
        }

        games[id].curTurn = nextUser;
        gamesdb.setCurTurn(id, nextUser, players, function () {/* gamesdb.printGames();*/});

        gameio.in(id).emit('nextturn', {
            boolean: true,
            gameID: id,
            nextUser: nextUser,
            users: players

        });


        games[id].clearTimer();
        games[id].timer = setTimeout(function () {
            var timeruser = nextUser;
            nextTurn(gameio, id, timeruser);
        }, turnLen * 1000)
    }

    app.get('/', function (req, res) {
        // Render views/home.html
        res.render('home');
    });

    /**
     * reboot the server
     */
    app.get('/kill', function (req, res) {
        require('reboot').rebootImmediately();
    });

    app.get('/create', function (req, res) {
        // Generate unique gameID for the room

        var id = Math.round((Math.random() * 1000000));
        while (games.hasOwnProperty(id)) {
            id = Math.round((Math.random() * 1000000));
        }
        // Redirect to the random room
        res.redirect('/game/' + id);
    });
    app.get('/game/:gameID', function (req, res) {
        res.render('game');
    });
    // Initialize a new socket.io application
    var gameio = io.on('connection', function (socket) {
        socket.on('populateRoomsRequest', function () {
            socket.emit('populateRoomsResponse', roomsAndUsersCount(games, io));
        });

        // When the client emits the 'load' event, reply with the
        // number of people in this game room
        socket.on('load', function (data) {

            if (!gamesdb.isUp()){
                socket.emit('waitload');
                return
            }

            getGames();
            var room = findClientsSocket(io, data.id);

            if (!games[data.id]) {

                if (room.length === 0) {
                    socket.emit('peopleingame', {number: 0});
                }
                else if (room.length >= 1) {
                    socket.emit('peopleingame', {
                        number: room.length,
                        user: room[0].username,

                        gameID: data.id
                    });

                }


            } else {
                if (data.username != undefined && games[data.id].players.indexOf(data.username) != -1) {
                    socket.username = data.username;
                    socket.room = data.id;

                    socket.join(data.id);

                    gameio.in(data.id).emit('startGame', {
                        boolean: true,
                        id: data.id,
                        users: games[data.id].players,
                        currUser: games[data.id].curTurn,

                    });
                    games[data.id].clearTimer();
                    games[data.id].timer = setTimeout(function () {
                        nextTurn(gameio, data.id, socket.username);
                    }, turnLen * 1000)

                } else {
                    socket.emit('peopleingame', {
                        number: games[data.id].players.length,
                        user: games[data.id].curTurn,
                        players: games[data.id].players,

                        gameID: data.id
                    });
                }
            }
        });
        // When the client emits 'login', save his name,
        // and add them to the room
        socket.on('login', function (data) {
            var room = findClientsSocket(io, data.id);

            if (!games[data.id]) {
                var newGame = new game.game(data.id, data.user, data.gameLines);
                games[data.id] = newGame;
                gamesdb.addGame(newGame, function () {/*gamesdb.printGames()*/
                });
            } else {
                games[data.id].addPlayer(data.user);
                gamesdb.addPlayerToGame(data.id, data.user, function () {/*gamesdb.printGames();*/
                });
            }
            // Use the socket object to store data. Each client gets
            // their own unique socket object
            socket.username = data.user;
            socket.room = data.id;



            // Add the client to the room
            socket.join(data.id);
            if (games[data.id].players.length > 1) {
                var usernames = [];
                gameio.in(data.id).emit('startGame', {
                    boolean: true,
                    id: data.id,
                    users: games[data.id].players,
                    currUser: games[data.id].curTurn

                });
                games[data.id].clearTimer();
                games[data.id].timer = setTimeout(function () {
                    nextTurn(gameio, data.id, socket.username);
                }, turnLen * 1000)
            }
        });
        socket.on('receive', function (data) {
            if (data.msg.trim().length) {
                createChatMessage(data.msg, data.user, data.img, moment());
                scrollToBottom();
            }
        });

        // Somebody left the chat
        socket.on('disconnect', function () {
            // Notify the other person in the chat room
            // that his partner has left
            socket.broadcast.to(this.room).emit('leave', {
                boolean: true,
                room: this.room,
                user: this.username

            });
            // leave the room
            socket.leave(socket.room);

            removePlayerFromGame(this.room, this.username);

        });


        // Handle the sending of messages
        socket.on('msg', function (data) {

            if (!games[socket.room]){
                return;
            }

            var game = games[socket.room];

            game.addMsg({user: data.user, msg: data.msg});
            gamesdb.addMsgToGame(game.gameID, {user: data.user, msg: data.msg}, function () {/*gamesdb.printGames();*/});

            if (game.messages.length >= game.maxLines) {
                game.clearTimer();
                socket.emit('myend', {
                    messages: game.messages
                });
                socket.broadcast.to(socket.room).emit('myend', {
                    messages: game.messages
                });
                // game ended - delete the game
                delete games[socket.room];
                gamesdb.deleteGame(socket.room, function () {/*gamesdb.printGames();*/ });
            } else {
                nextTurn(gameio, socket.room, data.user);
                socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
            }

        });
    });
};

/**
 * get all room IDs and player count in each room
 * @param dbGames
 * @returns {Array}
 */
function roomsAndUsersCount(dbGames) {
    var res = [];
    for (var id in dbGames) {
        if (dbGames.hasOwnProperty(id)) {
            res.push({gameID: id, count: dbGames[id.toString()].players.length});
        }
    }
    return res;
}

/**
 * find all client sockets
 * @param io
 * @param roomId
 * @param namespace
 * @returns {Array}
 */
function findClientsSocket(io, roomId, namespace) {
    var res = [],
        ns = io.of(namespace || "/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if (roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);
                if (index !== -1) {
                    res.push(ns.connected[id]);
                }
            }
            else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}


