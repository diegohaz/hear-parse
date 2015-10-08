import User from './models/User';
import Song from './models/Song';
import SongPost from './models/SongPost';
import Artist from './models/Artist';
import Genre from './models/Genre';

Parse.Cloud.beforeSave('_User', User.beforeSave);
Parse.Cloud.beforeSave('Song', Song.beforeSave);
Parse.Cloud.beforeSave('SongPost', SongPost.beforeSave);
Parse.Cloud.beforeSave('Artist', Artist.beforeSave);
Parse.Cloud.beforeSave('Genre', Genre.beforeSave);

Parse.Cloud.define('searchSong', function(request, response) {
  let string = request.params.string;
  let limit = request.params.limit || 10;

  Song.search(string, limit).then(response.success, response.error);
});

Parse.Cloud.define('postSong', function(request, response) {
  let id = request.params.id;
  let lat = +request.params.lat;
  let lng = +request.params.lng;
  let location = new Parse.GeoPoint(lat, lng);

  SongPost.post(id, location).then(response.success, response.error);
});

Parse.Cloud.define('listSongs', function(request, response) {
  let lat = +request.params.lat;
  let lng = +request.params.lng;
  let limit = request.params.limit || 30;
  let skip = request.params.skip || 0;
  let location = new Parse.GeoPoint({latitude: lat, longitude: lng});

  SongPost.list(location, limit, skip).then(response.success, response.error);
});