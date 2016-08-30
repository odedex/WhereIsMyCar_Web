/**
 * jQuery module to control /devices page on the webclient.
 * function is invoked when the page fully loads.
 */
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

    var ENTER_KEY = 13;

	/**
     * button listener for registering a new device
     */
    deviceRegisterSend.click(function () {
        if (deviceNameInput.val() === "" || deviceIDInput.val() === "") {
            setRegisterDeviceMsg("Please enter a name and ID");
        }
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

	/**
     * button listener for logging out
     */
    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });

	/**
     * input listener for 'enter' key for a new device name
     */
    deviceNameInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !deviceRegisterSend.is(':disabled')) {
            deviceRegisterSend.click();
        }
    });

    /**
     * input listener for 'enter' key for a new device id
     */
    deviceIDInput.on('keypress', function(key) {
        if (key.keyCode === ENTER_KEY && !deviceRegisterSend.is(':disabled')) {
            deviceRegisterSend.click();
        }
    });

	/**
     * When the page fully loads, emit a signal to the server requesting all devices tied to this user
     */
    socket.emit('populateDevicesRequest');

	/**
     * when the server sends the data for a new device object tied to the user, update the model accordingly
     */
    socket.on('populateDevice', function(device) {

        var li = $(
            '<li>' + device + '</li>'
        );
        li.addClass('list-group-item device');
        li.mouseover(function() {
            $(this).css('background-color', '#e6e6e6');
        });
        li.mouseout(function() {
            $(this).css('background-color', 'white');
        });
        li.click(function() {
            $.post("/listendevice", {   device:device,
                                        startTime: startTimeInput.val(),
                                        endTime: endTimeInput.val()},
                                    function (res, status, jqxhr) {
                document.location.href = res.redirect;
            });
        });
        devicesList.append(li);
    });

	/**
     * event listener for setting an error message for registering a new device
     */
    socket.on('setMsg', function(msg) {
        setRegisterDeviceMsg(msg);
    });

	/**
     * update the error message of the register new device window
     * @param msg message to set
     */
    function setRegisterDeviceMsg(msg) {
        deviceRegisterErrMsg.html(msg || "");
    }

	/**
     * check if a given string contains only characters and numbers
     * @param string string to check
     * @returns {boolean} true iff the string contains only characters and numbers
     */
    function isAlphanumeric(string){
        return (/^[a-z0-9]+$/i.test( string ));
    }

	/**
     * date time picker elements javascript
     */
    dateTimeStart.datetimepicker({
        useCurrent: false
    });
    dateTimeEnd.datetimepicker({
        useCurrent: false
    });
    dateTimeStart.on("dp.change", function (e) {
        dateTimeEnd.data("DateTimePicker").minDate(e.date);
    });
    dateTimeEnd.on("dp.change", function (e) {
        dateTimeStart.data("DateTimePicker").maxDate(e.date);
    });

});