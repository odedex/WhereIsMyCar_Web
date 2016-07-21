$(function() {
    var socket = io();

    var deviceNameInput = $("#deviceNameInput");
    var deviceIDInput = $("#deviceIDInput");

    var deviceRegisterSend = $("#deviceRegisterSend");
    var deviceRegisterErrMsg = $("#deviceRegisterErrMsg");

    var logOut = $("#logOut");

    var devicesList = $("#devicesList");
    var dateTimeStart = $("#dateTimeStart");
    var dateTimeEnd = $("#dateTimeEnd");

    var startTimeInput = $("#startTimeInput");
    var endTimeInput = $("#endTimeInput");

    deviceRegisterSend.click(function () {
        if (isAlphanumeric(deviceNameInput.val()) && isAlphanumeric(deviceIDInput.val())) {
            //TODO: do we need to check if device id is alpha numeric?
            var query = {name: deviceNameInput.val(), id:deviceIDInput.val()};
            $.post('/registrdevicetouser', query, function(res, status, jqxhr) {
                if (res.setErrMsg) {
                    setRegisterDeviceMsg(res.setErrMsg);
                }
            });
        }
    });


    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });

    deviceNameInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !deviceRegisterSend.is(':disabled')) {
            deviceRegisterSend.click();
        }
    });

    deviceIDInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !deviceRegisterSend.is(':disabled')) {
            deviceRegisterSend.click();
        }
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
            $.post("/listendevice", {device:device, startTime: startTimeInput.val(), endTime: endTimeInput.val()}, function (res, status, jqxhr) {
                document.location.href = res.redirect;
            });
        });
        devicesList.append(li);
    });

    socket.on('setMsg', function(msg) {
        setRegisterDeviceMsg(msg);
    });

    function setRegisterDeviceMsg(msg) {
        if (msg) {
            deviceRegisterErrMsg.html(msg);
        } else {
            deviceRegisterErrMsg.html("");
        }
    }

    function isAlphanumeric(string){
        return (/^[a-z0-9]+$/i.test( string ));
    }
    dateTimeStart.datetimepicker({
        useCurrent: false //Important! See issue #1075
    });
    dateTimeEnd.datetimepicker({
        useCurrent: false //Important! See issue #1075
    });
    dateTimeStart.on("dp.change", function (e) {
        dateTimeEnd.data("DateTimePicker").minDate(e.date);
    });
    dateTimeEnd.on("dp.change", function (e) {
        dateTimeStart.data("DateTimePicker").maxDate(e.date);
    });

});