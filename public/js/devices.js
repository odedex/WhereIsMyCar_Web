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

        var li = $(
            '<li>' + device + '</li>'
        );
        li.addClass('list-group-item device');
        li.mouseover(function() {
            jQuery(this).css('background-color', '#e6e6e6');
        });
        li.mouseout(function() {
            jQuery(this).css('background-color', 'white');
        });
        li.click(function() {
            $.post("/listendevice", {device:device}, function (res, status, jqxhr) {
                document.location.href = res.redirect;
            })
        });
        devicesList.append(li);
    })
});