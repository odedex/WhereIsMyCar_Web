$(function() {
    var socket = io();

    var deviceIDInput = $("#deviceIDInput");
    var deviceRegisterSend = $("#deviceRegisterSend");
    var deviceRegisterErrMsg = $("#deviceRegisterErrMsg");

    var logOut = $("#logOut"); //TODO: add logout support

    var devicesList = $("#devicesList");

    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });

    socket.emit('populateDevicesRequest');

    socket.on('populateDevice', function(device) {

        //todo: finish this, add mouseover, mouseout and click events
        console.log('populating ' + device);
        var li = $(

            // '<a title="Join" href="game/'+ room.gameID.toString() +'">' +
            // '<div class="openroom">' +
            // '<div gameID="big">' + room.gameID.toString() + '</div>' +
            // '<div gameID="small">Users: ' + room.count.toString() + '</div>' +
            // '</a>'
            '<label>' + device + '</label>'
        );
        li.addClass('list-group-item device');
        li.mouseover(function() {
            this.style.backgroundColor = "#e6e6e6";
        });
        li.mouseout(function() {
            this.style.backgroundColor = "white";
        });
        li.click(function() {
            $.post("/listendevice", {device:device}, function (res, status, jqxhr) {
                document.location.href = res.redirect;
            })
        });
        devicesList.append(li);

        // var nextStepRow = document.createElement('li');
        // nextStepRow.id = 'routeStep_' + routeStep.toString();
        // nextStepRow.className = 'list-group-item routstep';
        // nextStepRow.mapMarker = marker;
        // nextStepRow.onmouseover = function () {
        //     this.style.backgroundColor = "#e6e6e6";
        //     this.mapMarker.markerInfoWindow();
        // };
        // nextStepRow.onmouseout = function () {
        //     this.style.backgroundColor = "white";
        //     this.mapMarker.markerInfoWindowClose();
        // };
        // //
        // nextStepRow.appendChild(document.createTextNode(time.toString()));
        // // console.log(nextStepRow);
        // // routeSteps.appendChild(nextStepRow);
        //
        // if (routeSteps.children.length == 0) {
        //     routeSteps.appendChild(nextStepRow);
        // } else {
        //     routeSteps.insertBefore(nextStepRow, routeSteps.children[idx]);
        // }
        //
        // routeStep += 1;
    })
});