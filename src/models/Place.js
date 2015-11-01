import User from './User';

export default class Place {
  constructor(name, location, radius, parent) {
    this.name = name;
    this.location = location;
    this.radius = radius;
    this.parent = parent;
  }

  // view
  view() {
    let view = {};

    view.name = this.name;
    view.radius = this.radius;
    view.parent = this.parent? this.parent.view() : null;

    return view;
  }

  // fetch
  static fetch(location) {
    let types = ['country', 'administrative_area_level_1', 'locality', 'sublocality'];

    return Parse.Cloud.httpRequest({
      url: 'https://maps.googleapis.com/maps/api/geocode/json',
      params: {
        latlng: `${location.latitude},${location.longitude}`,
        key: 'AIzaSyB1X4p0p_8WO8DsamK0n32AbCjndOWxDJQ',
        language: User.current.locale
      }
    }).then(function(httpResponse) {
      let data = httpResponse.data;

      if (data.status == 'OK') {
        let results = data.results.reverse();
        let promises = [];
        let place = null;
        let parent = null;

        for (let i = 0; i < types.length; i++) {
          let type = types[i];

          for (let i = 0; i < results.length; i++) {
            let result = results[i];

            if (~result.types.indexOf(type)) {
              let name = result.address_components[0].long_name.replace('State of ', '');

              let location = result.geometry.location;
              let point = new Parse.GeoPoint(location.lat, location.lng);

              let locationNE = result.geometry.bounds.northeast;
              let locationSW = result.geometry.bounds.southwest;
              let pointNE = new Parse.GeoPoint(locationNE.lat, locationNE.lng);
              let pointSW = new Parse.GeoPoint(locationSW.lat, locationSW.lng);
              let radius = pointNE.kilometersTo(pointSW)*1000/2;

              place = new Place(name, point, radius, parent);
              parent = place;
            }
          }
        }

        return Parse.Promise.as(place.view());
      } else {
        return Parse.Promise.error(data.status);
      }
    });
  }
}