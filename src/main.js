import User from './models/User';
import Song from './models/Song';
import PlacedSong from './models/PlacedSong';
import Genre from './models/Genre';
import Artist from './models/Artist';
import Place from './models/Place';
import Tests from './tests';

Parse.Cloud.beforeSave('_User', User.beforeSave);
Parse.Cloud.beforeSave('Artist', Artist.beforeSave);
Parse.Cloud.beforeSave('Genre', Genre.beforeSave);
Parse.Cloud.beforeSave('Song', Song.beforeSave);
Parse.Cloud.afterSave('Song', Song.afterSave);
Parse.Cloud.beforeSave('PlacedSong', PlacedSong.beforeSave);

Parse.Cloud.define('fetchPlace', function(request, response) {
  let latitude = +request.params.latitude;
  let longitude = +request.params.longitude;

  let location = new Parse.GeoPoint(latitude, longitude);

  Place.fetch(location).then(response.success, response.error);
});

Parse.Cloud.define('searchSong', function(request, response) {
  let string = request.params.string;
  let limit = request.params.limit || undefined;

  Song.search(User.current.service, string, limit).then(response.success, response.error);
});

Parse.Cloud.define('listPlacedSongs', function(request, response) {
  let latitude = +request.params.latitude;
  let longitude = +request.params.longitude;
  let limit = request.params.limit || undefined;
  let offset = request.params.offset || undefined;
  let excludeIds = request.params.excludeIds || undefined;

  let location = new Parse.GeoPoint(latitude, longitude);

  PlacedSong.list(location, limit, offset, excludeIds).then(response.success, response.error);
});

Parse.Cloud.define('placeSong', function(request, response) {
  let serviceId = request.params.serviceId;
  let latitude = +request.params.latitude;
  let longitude = +request.params.longitude;

  let location = new Parse.GeoPoint(latitude, longitude);

  PlacedSong.place(serviceId, location).then(response.success, response.error);
});