$(function() {

    //todo update this entire javascript file.
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

    chooseDevice.click(function() {
        window.location.href = "/devices";
    });

    logOut.click(function() {
        $.post('/logoutuser', null, function (res, status, jqxhr) {
            document.location.href = res.redirect;
        });
    });

    socket.emit('queryGPSDataBulk');

    socket.on('deviceName', function(name) {
        deviceName.html(name);
    });

    socket.on('newGPSEntryBulk', function(entry) {
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        addStepAndMarker(latlng, entry.date);
    });

    socket.on('newGPSEntryLive', function(entry) {
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        fitMap(addStepAndMarker(latlng, entry.date));
    });

    socket.on('newGPSEntryErrorBulk', function(err) {
        setErrMsg(err);
    });

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

    function fitMap(newMarker) {
        bounds.extend(newMarker.getPosition());
        map.fitBounds(bounds);
    }

    function createMarker(pos) {
        var marker = new google.maps.Marker({
            map: map,
            //place: {location: place.originalLocation, placeId: place.placeID},
            animation: google.maps.Animation.DROP,
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

    function setErrMsg(msg) {
        if (msg) {
            errorMsg.html(msg);
        } else {
            errorMsg.html("");
        }
    }
});