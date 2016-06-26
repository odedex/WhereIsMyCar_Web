/**
 * Game object
 * @param roomid
 * @param player
 * @param gamelines
 * @param messeages
 * @param players
 * @returns {exports}
 */
module.exports.game = function (roomid, player, gamelines, messeages, players) {
    this.gameID = roomid;

    this.curTurn = player;
    this.maxLines = gamelines;
    this.timer = null;

    if (players){
        this.players = players
    } else {
        this.players = [player];
    }

    if (messeages){
        this.messages = messeages;
    } else {
        this.messages = [];
    }


    this.latestUpdate = Date.now(); //todo: maybe redundant


    this.addMsg = function (msg) {
        this.messages.push(msg);

        this.latestUpdate = Date.now();
    };

    this.clearTimer = function(){
        if (this.timer != null){
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.latestUpdate = Date.now();
    };

    this.addPlayer = function(player) {
        this.players.push(player);

        this.latestUpdate = Date.now();
    };
    /**
     * remove a player from the game.
     * @param player
     * @returns true iff there are still players in the game.
     */
    this.removePlayer = function(player) {
        var idx = this.players.indexOf(player);
        if (idx >= 0) {
            this.players.splice(idx, 1);
        }


        this.latestUpdate = Date.now();
        return this.players.length !== 0;
    };

    this.getTime = function () {
        return this.latestUpdate;
    };


    return this;
};


