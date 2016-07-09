$(function() {
    var socket = io();

    var devicesList = $("#devicesList");

    var deviceIDInput = $("#deviceIDInput");
    var deviceRegisterSend = $("#deviceRegisterSend");
    var deviceRegisterErrMsg = $("#deviceRegisterErrMsg");

    var logOut = $("#logOut"); //TODO: add logout support

    // loginSend.click(function() {
    //     if (isAlphanumeric(loginIdInput.val()) && isAlphanumeric(loginPassInput.val())) {
    //         var query = {user:loginIdInput.val(), pass:SHA256(loginPassInput.val())};
    //
    //         // socket.emit("doLogin", {user:loginIdInput.val(), pass:SHA256(loginPassInput.val())})
    //     } else {
    //         // setLoginMsg("Not alpha numeric!"); //TODO: use this or not?
    //     }
    // });
    //
    // registerSend.click(function() {
    //     if (isAlphanumeric(registerIdInput.val()) && isAlphanumeric(registerPassInput.val())) {
    //         var query = {user:registerIdInput.val(), pass:SHA256(registerPassInput.val())};
    //         $.post('/registeruser', query);
    //     } else {
    //         // registerErrMsg("Not alpha numeric!"); //TODO: use this or not?
    //     }
    // });
    //
    // loginIdInput.on('keypress', function(key) {
    //     if (key.keyCode === 13 && !loginSend.is(':disabled')) {
    //         document.getElementById("loginSend").click();
    //     }
    // });
    //
    // loginPassInput.on('keypress', function(key) {
    //     if (key.keyCode === 13 && !loginSend.is(':disabled')) {
    //         document.getElementById("loginSend").click();
    //     }
    // });
    //
    // registerIdInput.on('keypress', function(key) {
    //     if (key.keyCode === 13 && !registerSend.is(':disabled')) {
    //         document.getElementById("registerSend").click();
    //     }
    // });
    //
    // registerPassInput.on('keypress', function(key) {
    //     if (key.keyCode === 13 && !registerSend.is(':disabled')) {
    //         document.getElementById("registerSend").click();
    //     }
    // });
    //
    //
    //
    // function setLoginMsg(msg) {
    //     if (msg) {
    //         loginErrMsg.html(msg);
    //     } else {
    //         loginErrMsg.html("")
    //     }
    // }
    //
    // function setRegisterMsg(msg) {
    //     if (msg) {
    //         registerErrMsg.html(msg);
    //     } else {
    //         registerErrMsg.html("")
    //     }
    // }
    //
    // function isAlphanumeric(string){
    //     return (/^[a-z0-9]+$/i.test( string ));
    // }
});