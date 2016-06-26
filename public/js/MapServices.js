
/**
 *
 * @param start poi.location
 * @param finish poi.location
 * @returns {Distance}
 */
function getDistance(start, finish) {
    var distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(start.lat, start.lng), new google.maps.LatLng(finish.lat, finish.lng));
    // distance --> km. / 60 km per hour
    var time = ((distanceInMeters / 1000) / KM_PER_HOUR);

    return new Distance(start, finish, time * DRIVING_FACTOR, distanceInMeters);
}