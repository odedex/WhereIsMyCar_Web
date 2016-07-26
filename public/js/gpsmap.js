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

    socket.emit('queryGPSData');

    socket.on('deviceName', function(name) {
        deviceName.html(name);
    });

    socket.on('newGPSEntry', function(entry) {
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        addStepAndMarker(latlng, entry.date);
    });

    socket.on('newGPSEntryError', function(err) {
        setErrMsg(err);
    });

    function fitMap() {
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
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


        bounds.extend(marker.getPosition());
        map.fitBounds(bounds);


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
        setTimeout(function () {
            var marker = createMarker(pos);
            setTimeout(function () {
                for (var i = 0 ; i < steps.length ; i += 1) {
                    if (new Date(time) < new Date(steps[i].date)) {
                        steps.splice(i, 0, {marker: marker, date:time});
                        break;
                    }
                }
                setTimeout(function () {
                    if (i === steps.length) {
                        steps.push({marker: marker, date:time});
                    }

                    addRouteStep(time, marker, i);
                }, 0)

            }, 0);

        }, 0);
    }

    function setErrMsg(msg) {
        if (msg) {
            errorMsg.html(msg);
        } else {
            errorMsg.html("");
        }
    }
});