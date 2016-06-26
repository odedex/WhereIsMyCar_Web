/**
 * Created by OdedA on 25-Jan-16.
 */

function POI(googlePOIObject, location) {
    this.self = this;
    if (location == null) {

        this.placeID = googlePOIObject.place_id;
        this.name = googlePOIObject.name;
        this.originalLocation = googlePOIObject.geometry.location;
        this.location = {lat: googlePOIObject.geometry.location.lat(), lng: googlePOIObject.geometry.location.lng()};
        this.types = googlePOIObject.types;
        this.rating = googlePOIObject.rating;
        this.photos = googlePOIObject.photos;
    } else {
        this.placeID = googlePOIObject;
        this.name = googlePOIObject;
        this.location = location;
        this.types = [];
        this.rating = 0
    }
    this.time = 2;

    return this;
}