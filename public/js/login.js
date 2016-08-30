/**
 * jQuery module to control /login page (landing page) on the webclient.
 * function is invoked when the page fully loads.
 */
$(function() {
    var loginIdInput = $("#loginIdInput");
    var loginPassInput = $("#loginPassInput");
    var loginSend = $("#loginSend");
    var loginErrMsg = $("#loginErrMsg");

    var registerIdInput = $("#registerIdInput");
    var registerPassInput = $("#registerPassInput");
    var registerSend = $("#registerSend");
    var registerErrMsg = $("#registerErrMsg");

    var ENTER_KEY = 13;

	/**
     * button click listener for the login button
     */
    loginSend.click(function() {
        if (isAlphanumeric(loginIdInput.val()) && isAlphanumeric(loginPassInput.val())) {
            var query = {user:loginIdInput.val(), pass:sha256(loginPassInput.val())};
            $.post('/loginuser', query, function (res, status, jqxhr) {
                if (res.redirect) {
                    document.location.href = res.redirect;
                } else {
                    setLoginMsg(res.setErrMsg);
                }
            });
        } else {
            setLoginMsg("Please use only numbers and characters.");
        }
    });

	/**
     * button click listener for the register button
     */
    registerSend.click(function() {
        if (isAlphanumeric(registerIdInput.val()) && isAlphanumeric(registerPassInput.val())) {
            var query = {user:registerIdInput.val(), pass:sha256(registerPassInput.val())};
            $.post('/registeruser', query, function(res, staus, jqxhr) {
                if (res.redirect) {
                    document.location.href = res.redirect;
                } else {
                    setRegisterMsg(res.setErrMsg);
                }
            });
        } else {
            setRegisterMsg("Please use only numbers and characters.");
        }
    });

    /**
     * input listener for 'enter' key for login id input
     */
    loginIdInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !loginSend.is(':disabled')) {
            loginSend.click();
        }
    });

    /**
     * input listener for 'enter' key for login pass input
     */
    loginPassInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !loginSend.is(':disabled')) {
            loginSend.click();
        }
    });

    /**
     * input listener for 'enter' key for register id input
     */
    registerIdInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !registerSend.is(':disabled')) {
            registerSend.click();
        }
    });

    /**
     * input listener for 'enter' key for register pass input
     */
    registerPassInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !registerSend.is(':disabled')) {
            registerSend.click();
        }
    });

	/**
     * set the login error message
     * @param msg string
     */
    function setLoginMsg(msg) {
        loginErrMsg.html(msg || "");
    }

	/**
     * set the register error message
     * @param msg string
     */
    function setRegisterMsg(msg) {
        registerErrMsg.html(msg || "");
    }

    /**
     * check if a given string contains only characters and numbers
     * @param string string to check
     * @returns {boolean} true iff the string contains only characters and numbers
     */
    function isAlphanumeric(string){
        return (/^[a-z0-9]+$/i.test( string ));
    }
});