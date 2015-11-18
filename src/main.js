import User from './models/User';
import Artist from './models/Artist';
import Beacon from './models/Beacon';
import Genre from './models/Genre';
import Place from './models/Place';
import PlacedSong from './models/PlacedSong';
import Playback from './models/Playback';
import Song from './models/Song';

Parse.Cloud.beforeSave('_User', User.beforeSave);
Parse.Cloud.beforeSave('Artist', Artist.beforeSave);
Parse.Cloud.beforeSave('Beacon', Beacon.beforeSave);
Parse.Cloud.beforeSave('Genre', Genre.beforeSave);
Parse.Cloud.beforeSave('PlacedSong', PlacedSong.beforeSave);
Parse.Cloud.beforeSave('Playback', Playback.beforeSave);
Parse.Cloud.beforeSave('Song', Song.beforeSave);
Parse.Cloud.afterSave('Song', Song.afterSave);

Parse.Cloud.define('fetchPlace', function(request, response) {
  let latitude = +request.params.latitude;
  let longitude = +request.params.longitude;
  let beaconUUID = request.params.beaconUUID || undefined;

  let location = new Parse.GeoPoint(latitude, longitude);

  Place.fetch(location, beaconUUID).then(response.success, response.error);
});

Parse.Cloud.define('searchSong', function(request, response) {
  let string = request.params.string;
  let limit = request.params.limit || undefined;

  Song.search(User.current().service, string, limit).then(response.success, response.error);
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
  let beaconUUID = request.params.beaconUUID || undefined;

  let location = new Parse.GeoPoint(latitude, longitude);

  PlacedSong.place(serviceId, location, beaconUUID).then(response.success, response.error);
});

Parse.Cloud.define('listened', function(request, response) {
  let playbacks = request.params.playbacks || [request.params.playback];
  let objects = [];

  playbacks.forEach(function(playback) {
    let object = new Playback;

    object.set('song', Song.createWithoutData(playback.songId));
    object.set('location', new Parse.GeoPoint(playback.latitude, playback.longitude));
    object.set('rate', playback.rate);

    objects.push(object);
  });

  Parse.Object.saveAll(objects).then(response.success, response.error);
});