/**
 * Created by OdedA on 25-Jan-16.
 */

var logTextArea;
var routeSteps;
bounds = new google.maps.LatLngBounds();


infowindow = new google.maps.InfoWindow();
var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function initializeUIServices(document) {
    routeSteps = document.getElementById("routeSteps");
}

function createMarker(place, map, index) {
    var marker = new google.maps.Marker({
        map: map,
        //place: {location: place.originalLocation, placeId: place.placeID},
        animation: google.maps.Animation.DROP,
        //label: labels[labelIndex++ % labels.length],
        position: place.location
    });

    marker.markerInfoWindow = function () {
        infowindow.setContent(place.name + "<br>" + place.rating);
        infowindow.open(map, this);
    };

    marker.markerInfoWindowClose = function () {
        infowindow.close();
    };

    google.maps.event.addListener(marker, 'click', function () {
        marker.markerInfoWindow();
    });

    markers.splice(index, 0, marker);

    var labelIndex = 0;
    markers.forEach(function (x) {
        x.setLabel(labels[labelIndex % labels.length]);
        labelIndex = labelIndex + 1;
    });


    bounds.extend(marker.getPosition());
    map.fitBounds(bounds);


    return marker;
}

var routeStep = 1;
function addRouteStep(poi, index, marker, remainingTime, originalTime) {
    var nextStepRow = document.createElement('li');
    nextStepRow.id = 'routeStep_' + routeStep.toString();
    nextStepRow.className = 'list-group-item routstep';
    nextStepRow.mapMarker = marker;
    //nextStepRow.innerHTML =
    nextStepRow.onmouseover = function () {
        this.style.backgroundColor = "#e6e6e6";
        this.mapMarker.markerInfoWindow();
    };
    nextStepRow.onmouseout = function () {
        this.style.backgroundColor = "white";
        this.mapMarker.markerInfoWindowClose();
    };

    nextStepRow.appendChild(document.createTextNode(poi.name.toString()));
    routeStep += 1;

    if (routeSteps.children.length == 0) {
        routeSteps.appendChild(nextStepRow);
    } else {
        routeSteps.insertBefore(nextStepRow, routeSteps.children[index]);
    }
}

function clear() {

    markers.forEach(function (m) {
        m.setMap(null);
    });


    // delete route from map.
    directionsDisplay.setDirections({geocoded_waypoints: [], routes: [], status: 'OK', request: Object});

    var routeInformation = document.getElementById("routeInformation");
    while (routeInformation.firstChild) {
        routeInformation.removeChild(routeInformation.firstChild);
    }

    // clear all route steps
    routeSteps.innerHTML = "";
    routeStep = 1;

    markers = [];
    markers.forEach(function (m) {
        m.setMap(map);
    });

    bounds = new google.maps.LatLngBounds();
    fitMap();
}

function queryGpsID(gpsid) {
    document.body.style.cursor = 'wait';
    var searchButton = document.getElementById("sendButton");
    searchButton.disabled = true;
    searchAlgo.searchRoute(startAddressLoc, endAddressLoc, tourLength, function (result, error) {
        if (result) {
            log("==== RESULT ====");
            addRouteStep(result.pois[0], 0, startMarker, result.timeRemainingHours, result.originalTime);
            addRouteStep(result.pois[result.pois.length - 1], result.pois.length - 1, endMarker, result.timeRemainingHours, result.originalTime);

            if (gpsid === "Genetic Search") {
                for (var j = 1; j < result.pois.length - 1; j++) {
                    addStepAndMarker(result, j);
                }
            }

            updateProgressBar(0);

            printScores(heuristic.detailedScores(result));
            fitMap();
        }

        document.body.style.cursor = 'default';
        searchButton.disabled = false;
    });
}