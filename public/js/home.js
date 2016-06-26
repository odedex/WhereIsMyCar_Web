$(function() {

    var rooms = $(".rooms");
    var socket = io();

    socket.emit('populateRoomsRequest');

    socket.on('populateRoomsResponse', function (roomIds) {
        roomIds.forEach(function(room) {
            var li = $(

                '<a title="Join" href="game/'+ room.gameID.toString() +'">' +
                '<div class="openroom">' +
                '<div gameID="big">' + room.gameID.toString() + '</div>' +
                '<div gameID="small">Users: ' + room.count.toString() + '</div>' +
                '</a>'
           );
           rooms.append(li);
       })
    });

    }
);