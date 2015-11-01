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

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // view
  view() {
    let view = this.get('song').view();

    view.songId   = view.id;
    view.id       = this.id;
    view.user     = this.get('user').view();
    view.url      = 'http://hear.ws/p/' + this.id;
    view.likes    = this.get('likes');
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

      placedSong.set('user', User.current);
      placedSong.set('song', song);
      placedSong.set('location', location);

      return placedSong.save().then(function(placedSong) {
        let view = placedSong.view();

        view.distance = 0;

        return Parse.Promise.as(view);
      });
    });
  }

  // list
  static list(location, limit = 22, offset = 0, excludeIds = []) {
    let removedSongs = User.current.removedSongs;
    let removedArtists = User.current.removedArtists;
    let serviceName = User.current.service.name;
    let songQuery = new Parse.Query(Song);

    songQuery.exists(User.current.service.name);

    if (removedSongs.length) {
      songQuery.notContainedIn('objectId', User.current.removedSongs);
    }

    if (removedArtists.length) {
      let artistQuery = new Parse.Query(Artist);
      artistQuery.notContainedIn('objectId', removedArtists);
      songQuery.matchesQuery('artist', artistQuery);
    }

    let placedSongs = new Parse.Query(PlacedSong);

    placedSongs.include(['song', 'song.genre']);
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