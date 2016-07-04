$(function() {
    var socket = io();

    // ui elements
    var sendButton = $("#sendButton");
    var gpsidInput = $("#gpsidInput");
    // var routeSteps = $("#routeSteps");
    var errorMsg = $("#errorMsg");

    var routeSteps = document.getElementById("routeSteps");
    var steps = [];

    // map related variables
    var markers = [];
    var bounds = new google.maps.LatLngBounds();
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var infowindow = new google.maps.InfoWindow();
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var routeStep = 1;

    // map init
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions({suppressMarkers: true});


    sendButton.click(function() {
        if (gpsidInput.val()) {
            sendButton.prop("disabled", true);
            clear();
            socket.emit("queryGPSID", gpsidInput.val());
        } else {
            setErrMsg("please enter an id!");
        }
    });

    gpsidInput.on('keypress', function(key) {
        if (key.keyCode === 13 && !sendButton.is(':disabled')) {
            document.getElementById("sendButton").click();
        }
    });

    /**
     * @deprecated use newGPSEntry
     */
    socket.on('queryGPSIDResponse', function(response) {
       if (response.err) {
           setErrMsg(response.err);
       } else {
           // console.log(response.data);
           if (response.data.length > 0) {
               clear();
           } else {
               setErrMsg("given ID has no results!")
           }
           response.data.forEach(function(loc) {
               var latlng = new google.maps.LatLng({lat: parseFloat(loc.lat), lng: parseFloat(loc.lng)});
               addStepAndMarker(latlng, loc.date);
           })
       }
        sendButton.prop("disabled", false);
    });
    
    socket.on('newGPSEntry', function(entry) {
        console.log(entry);
        var latlng = new google.maps.LatLng({lat: parseFloat(entry.lat), lng: parseFloat(entry.lng)});
        addStepAndMarker(latlng, entry.date);
    });

    socket.on('newGPSEntryError', function(err) {
        setErrMsg(err);
    });

    socket.on('newGPSEntryEnd', function() {
        sendButton.prop("disabled", false);
    });


    function clear() {
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // delete route from map.
        directionsDisplay.setDirections({geocoded_waypoints: [], routes: [], status: 'OK', request: Object});

        // clear all route steps
        routeSteps.innerHTML = "";
        routeStep = 1;
        steps = [];

        bounds = new google.maps.LatLngBounds();
        // fitMap();

        setErrMsg();
    }

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

        var nextStepRow = document.createElement('li');
        nextStepRow.id = 'routeStep_' + routeStep.toString();
        nextStepRow.className = 'list-group-item routstep';
        nextStepRow.mapMarker = marker;
        nextStepRow.onmouseover = function () {
            this.style.backgroundColor = "#e6e6e6";
            this.mapMarker.markerInfoWindow();
        };
        nextStepRow.onmouseout = function () {
            this.style.backgroundColor = "white";
            this.mapMarker.markerInfoWindowClose();
        };
        //
        nextStepRow.appendChild(document.createTextNode(time.toString()));
        // console.log(nextStepRow);
        // routeSteps.appendChild(nextStepRow);

        if (routeSteps.children.length == 0) {
            routeSteps.appendChild(nextStepRow);
        } else {
            routeSteps.insertBefore(nextStepRow, routeSteps.children[idx]);
        }

        routeStep += 1;

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
    }

    function setErrMsg(msg) {
        if (msg) {
            errorMsg.html(msg);
        } else {
            errorMsg.html("")
        }

    }
    
    

    // socket.emit('populateRoomsRequest');
    //
    // socket.on('populateRoomsResponse', function (roomIds) {
    //     roomIds.forEach(function(room) {
    //         var li = $(
    //
    //             '<a title="Join" href="game/'+ room.gameID.toString() +'">' +
    //             '<div class="openroom">' +
    //             '<div gameID="big">' + room.gameID.toString() + '</div>' +
    //             '<div gameID="small">Users: ' + room.count.toString() + '</div>' +
    //             '</a>'
    //         );
    //         sendButton.append(li);
    //     })
    // });

});