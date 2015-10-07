import User from './models/User';
import Song from './models/Song';
import Artist from './models/Artist';
import Genre from './models/Genre';

Parse.Cloud.beforeSave('_User', User.beforeSave);
Parse.Cloud.beforeSave('Song', Song.beforeSave);
Parse.Cloud.beforeSave('Artist', Artist.beforeSave);
Parse.Cloud.beforeSave('Genre', Genre.beforeSave);

Parse.Cloud.define('searchSong', function(request, response) {
  let string = request.params.string;
  let limit = request.params.limit || 10;

  Song.search(string, limit).then(response.success, response.error);
});