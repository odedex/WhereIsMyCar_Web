$(function() {
    var socket = io();

    var deviceNameInput = $("#deviceNameInput");
    var deviceIDInput = $("#deviceIDInput");

    var deviceRegisterSend = $("#deviceRegisterSend");
    var deviceRegisterErrMsg = $("#deviceRegisterErrMsg");

    var logOut = $("#logOut");

    var devicesList = $("#devicesList");

    deviceRegisterSend.click(function () {
        if (isAlphanumeric(deviceNameInput.val()) && isAlphanumeric(deviceIDInput.val())) {
            //TODO: do we need to check if device id is alpha numeric?
            var query = {name: deviceNameInput.val(), id:deviceIDInput.val()};
            $.post('/registrdevicetouser', query, function(res, status, jqxhr) {
                if (res.setErrMsg) {
                    setRegisterDeviceMsg(res.setErrMsg);
                }
            })
        }
    });

    // loginSend.click(function() {
    //     if (isAlphanumeric(loginIdInput.val()) && isAlphanumeric(loginPassInput.val())) {
    //         var query = {user:loginIdInput.val(), pass:SHA256(loginPassInput.val())};
    //         $.post('/loginuser', query, function (res, status, jqxhr) {
    //             if (res.redirect) {
    //                 document.location.href = res.redirect;
    //             } else {
    //                 setLoginMsg(res.setErrMsg);
    //             }
    //         });
    //     } else {
    //         setLoginMsg("Please use only numbers and characters.");
    //     }
    // });


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
    });

    socket.on('setMsg', function(msg) {
        setRegisterDeviceMsg(msg);
    });

    function setRegisterDeviceMsg(msg) {
        if (msg) {
            deviceRegisterErrMsg.html(msg);
        } else {
            deviceRegisterErrMsg.html("")
        }
    }

    function isAlphanumeric(string){
        return (/^[a-z0-9]+$/i.test( string ));
    }
});