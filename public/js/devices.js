$(function() {
    var socket = io();

    var logOut = $("#logOut"); //TODO: add logout support

    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });
});