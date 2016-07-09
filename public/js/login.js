$(function() {
    var socket = io();

    var loginIdInput = $("#loginIdInput");
    var loginPassInput = $("#loginPassInput");
    var loginSend = $("#loginSend");
    var loginErrMsg = $("#loginErrMsg");

    var registerIdInput = $("#registerIdInput");
    var registerPassInput = $("#registerPassInput");
    var registerSend = $("#registerSend");
    var registerErrMsg = $("#registerErrMsg");


    loginSend.click(function() {
        if (isAlphanumeric(loginIdInput.val()) && isAlphanumeric(loginPassInput.val())) {
            var query = {user:loginIdInput.val(), pass:SHA256(loginPassInput.val())};
            $.post('/loginuser', query, function (res, status, jqxhr) {
                if (res.redirect) {
                    document.location.href = res.redirect;
                }
            });
            // socket.emit("doLogin", {user:loginIdInput.val(), pass:SHA256(loginPassInput.val())})
        } else {
            // setLoginMsg("Not alpha numeric!"); //TODO: use this or not?
        }
    });

    registerSend.click(function() {
        if (isAlphanumeric(registerIdInput.val()) && isAlphanumeric(registerPassInput.val())) {
            var query = {user:registerIdInput.val(), pass:SHA256(registerPassInput.val())};
            $.post('/registeruser', query);
        } else {
            // registerErrMsg("Not alpha numeric!"); //TODO: use this or not?
        }
    });

    loginIdInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !loginSend.is(':disabled')) {
            document.getElementById("loginSend").click();
        }
    });

    loginPassInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !loginSend.is(':disabled')) {
            document.getElementById("loginSend").click();
        }
    });

    registerIdInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !registerSend.is(':disabled')) {
            document.getElementById("registerSend").click();
        }
    });

    registerPassInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !registerSend.is(':disabled')) {
            document.getElementById("registerSend").click();
        }
    });



    function setLoginMsg(msg) {
        if (msg) {
            loginErrMsg.html(msg);
        } else {
            loginErrMsg.html("")
        }
    }

    function setRegisterMsg(msg) {
        if (msg) {
            registerErrMsg.html(msg);
        } else {
            registerErrMsg.html("")
        }
    }

    function isAlphanumeric(string){
        return (/^[a-z0-9]+$/i.test( string ));
    }
});