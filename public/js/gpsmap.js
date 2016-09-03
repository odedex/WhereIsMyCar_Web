/**
 * jQuery module to control /gpsmap page on the webclient.
 * function is invoked when the page fully loads.
 */
$(function() {

    var socket = io();

    var chooseDevice = $("#chooseDevice");
    var logOut = $("#logOut");

    // ui elements
    var route = $("#route");
    var routeSteps = $("#routeSteps");
    var deviceName = $("#deviceName");

    // var routeSteps = document.getElementById("routeSteps");
    var steps = [];

    // map related variables
    var markers = [];
    var bounds = new google.maps.LatLngBounds();
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var infowindow = new google.maps.InfoWindow();
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var routeStep = 1;

    // map init
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions({suppressMarkers: true});

	/**
	 * button listener for choosing a different device
	 */
    chooseDevice.click(function() {
        window.location.href = "/devices";
    });

	/**
	 * button click listener for logging out
	 */
    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });

	/**
	 * emit a signal for the server requesting all location data for a given device, based on the session of the user,
	 * handled by the server
	 */
    socket.emit('queryGPSDataBulk');

	/**
	 * socket listener for updating the name of the device element in the page
	 */
    socket.on('deviceName', function(name) {
        deviceName.html(name);
    });

	/**
	 * socket listener for receiving a new gps data entry from the database
	 */
    socket.on('newGPSEntryBulk', function(entry) {
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        addStepAndMarker(latlng, entry.date);
    });

	/**
	 * socket listener for receiving a new gps data entry from a live update
	 */
    socket.on('newGPSEntryLive', function(entry) {
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        fitMap(addStepAndMarker(latlng, entry.date));
    });

	/**
	 * socket listener for receiving an error message that may have happened in the server
	 */
    socket.on('newGPSEntryBulkError', function(err) {
        setErrMsg(err);
    });

	/**
	 * socket listener for the end of the bulk database gps data
	 */
    socket.on('newGPSEntryBulkEnd', function() {
        var lastTen = markers.slice(Math.max(markers.length - 5, 0));
        var processed = 0;
        lastTen.forEach(function(marker) {
            bounds.extend(marker.getPosition());
            processed += 1;
            if (processed === lastTen.length) {
                map.fitBounds(bounds);
            }
        });
    });

	/**
	 * fir the googlemap element to contain a given marker in frame
	 * @param newMarker the marker to fir in the map view
	 */
    function fitMap(newMarker) {
        bounds.extend(newMarker.getPosition());
        map.fitBounds(bounds);
    }

	/**
	 * create a new google map marker element based on a given position
	 * @param pos LatLng element for the marker position
	 * @returns {google.maps.Marker}
	 */
	function createMarker(pos) {
        var marker = new google.maps.Marker({
            map: map,
            //place: {location: place.originalLocation, placeId: place.placeID},
            // animation: google.maps.Animation.DROP,
            //label: labels[labelIndex++ % labels.length],
            position: pos
        });

        marker.markerInfoWindow = function () {
            infowindow.setContent("Position <br>");
            infowindow.open(map, this);
        };

        marker.markerInfoWindowClose = function () {
            infowindow.close();
        };

        google.maps.event.addListener(marker, 'click', function () {
            marker.markerInfoWindow();
        });

        markers.push(marker);

        var labelIndex = 0;
        markers.forEach(function (x) {
            x.setLabel(labels[labelIndex % labels.length]);
            labelIndex = labelIndex + 1;
        });

        return marker;
    }

	/**
	 * add an html element to the list of steps of the map
	 * @param time time signature of the position
	 * @param marker map element containing the location
	 * @param idx step number
	 */
    function addRouteStep(time, marker, idx) {
        var li = $('<li></li>');
        li.attr('id', 'routeStep_' + routeStep.toString());
        li.data('mapMarker', marker);
        li.addClass('list-group-item routestep');
        li.mouseover(function() {
            $(this).css('background-color', '#e6e6e6');
            $(this).data('mapMarker').markerInfoWindow();
        });
        li.mouseout(function() {
            $(this).css('background-color', 'white');
            $(this).data('mapMarker').markerInfoWindowClose();
        });

        li.append(time.toString()); //TODO: need to adjust for time zones?

        if(idx === 0) {
            routeSteps.prepend(li);
        } else {
            $("#routeSteps > li:nth-child(" + (idx) + ")").after(li);
        }
        routeStep += 1;

        route.scrollTop(route.prop('scrollHeight'));
    }

	/**
	 * given a position and a timestamp, create a new marker and a new html element for the new step
	 * @param pos LatLng element
	 * @param time Date element
	 * @returns {google.maps.Marker}
	 */
    function addStepAndMarker(pos, time) {
        var marker = createMarker(pos);
        for (var i = 0 ; i < steps.length ; i += 1) {
            if (new Date(time) < new Date(steps[i].date)) {
                steps.splice(i, 0, {marker: marker, date:time});
                break;
            }
        }
        if (i === steps.length) {
            steps.push({marker: marker, date:time});
        }

        addRouteStep(time, marker, i);
        return marker;
    }

	/**
	 * set the error message
	 * @param msg string to set.
	 */
	function setErrMsg(msg) {
        if (msg) {
            errorMsg.html(msg);
        } else {
            errorMsg.html("");
        }
    }
});