import Artist from './Artist';
import Song from './Song';
import User from './User';
//import moment from 'moment/min/moment-with-locales.min';

export default class PlacedSong extends Parse.Object {
  constructor() {
    super('PlacedSong');
  }

  // schematize
  schematize() {
    this.get('user')     || this.set('user', User.createWithoutData('null'));
    this.get('song')     || this.set('song', Song.createWithoutData('null'));
    this.get('location') || this.set('location', new Parse.GeoPoint());

    let acl = new Parse.ACL(this.get('user'));
    acl.setPublicReadAccess(true)

    this.setACL(acl);
  }

  // view
  view() {
    let view = this.get('song').view();

    view.id       = this.id;
    view.user     = this.get('user').view();
    view.url      = 'http://hear.ws/p/' + this.id;
    view.location = {
      latitude: this.get('location').latitude,
      longitude: this.get('location').longitude
    };

    return view;
  }

  // beforeSave
  static beforeSave(request, response) {
    let placedSong = request.object;

    placedSong.schematize();

    if (!placedSong.get('user')) return response.error('Empty user');
    if (!placedSong.get('song')) return response.error('Empty song');
    if (!placedSong.get('location')) return response.error('Empty location');

    response.success();
  }

  // Post
  static place(id, location) {
    Parse.Cloud.useMasterKey();

    return Song.create(User.current.service, id).then(function(song) {
      let placedSong = new PlacedSong;
      let removedSongs = User.current.get('removedSongs');
      let removedArtists = User.current.get('removedArtists');

      placedSong.set('user', User.current);
      placedSong.set('song', song);
      placedSong.set('location', location);

      if (~removedSongs.indexOf(song.id)) {
        User.current.remove('removedSongs', song.id);
        User.current.save();
      }

      if (~removedArtists.indexOf(song.get('artist').id)) {
        User.current.remove('removedArtists', song.get('artist').id);
        User.current.save();
      }

      return placedSong.save().then(function(placedSong) {
        let view = placedSong.view();

        view.distance = 0;

        return Parse.Promise.as(view);
      })
    });
  }

  // list
  static list(location, limit = 31, offset = 0, excludeIds = []) {
    let removedSongs = User.current.removedSongs;
    let serviceName = User.current.service.name;
    let songQuery = new Parse.Query(Song);

    songQuery.exists(User.current.service.name);

    if (removedSongs.length) {
      songQuery.notContainedIn('objectId', User.current.removedSongs);
    }

    let placedSongs = new Parse.Query(PlacedSong);

    placedSongs.include(['song', 'song.genre', 'song.artist']);
    placedSongs.near('location', location);
    placedSongs.matchesQuery('song', songQuery);
    placedSongs.withinKilometers('location', location, 20000);
    placedSongs.limit(limit * 10);
    placedSongs.skip(offset);

    return placedSongs.find().then(function(placedSongs) {
      let songsIds = excludeIds;
      let views = [];
      let results = {};

      for (let i = 0; i < placedSongs.length && views.length < limit; i++) {
        let placedSong = placedSongs[i];
        let song = placedSong.get('song');
        offset++;

        if (!~songsIds.indexOf(song.id)) {
          let view = placedSong.view();

          view.distance = placedSong.get('location').kilometersTo(location)*1000;
          view.distance = Math.round(view.distance);

          songsIds.push(song.id);
          views.push(view);
        }
      }

      results.offset = offset;
      results.songs = views;

      return Parse.Promise.as(results);
    });
  }

}

Parse.Object.registerSubclass('PlacedSong', PlacedSong);