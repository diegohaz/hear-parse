import Artist from './Artist';
import Song from './Song';
import Playback from './Playback';
import User from './User';
import Beacon from './Beacon';
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
    acl.setPublicReadAccess(true);

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

    if (!placedSong.get('user')) return response.error('Empty user');
    if (!placedSong.get('song')) return response.error('Empty song');
    if (!placedSong.get('location')) return response.error('Empty location');

    placedSong.schematize();
    response.success();
  }

  // Post
  static place(id, location, beaconUUID = null) {
    let user = User.current();
    let placedSong = new PlacedSong;

    if (!user) return Parse.Promise.error('Empty user');
    if (!location) return Parse.Promise.error('Empty location');

    user.set('location', location);
    user.save();

    placedSong.set('user', user);
    placedSong.set('location', location);

    return Song.create(user.service, id).then(function(song) {
      placedSong.set('song', song);

      return Beacon.get(beaconUUID);
    }).then(function(beacon) {
      placedSong.set('beacon', beacon);

      return placedSong.save();
    }).then(function(placedSong) {
      let view = placedSong.view();

      view.distance = 0;

      return Parse.Promise.as(view);
    });
  }

  // list
  static list(location, limit = 31, offset = 0, excludeIds = []) {
    let user = User.current();

    if (!user) return Parse.Promise.error('Empty user');

    user.set('location', location);
    user.save();

    let removedSongs = user.get('removedSongs');
    let songQuery = new Parse.Query(Song);
    let placedSongs = new Parse.Query(PlacedSong);
    let taste;

    if (removedSongs.length) {
      songQuery.notContainedIn('objectId', removedSongs);
    }

    songQuery.exists(user.service.name);
    placedSongs.matchesQuery('song', songQuery);
    placedSongs.include(['song', 'song.genre', 'song.artist']);
    placedSongs.near('location', location);
    placedSongs.withinKilometers('location', location, 20000);
    placedSongs.limit(limit * 10);
    placedSongs.skip(offset);

    return user.taste().then(function(result) {
      taste = result;

      return placedSongs.find();
    }).then(function(placedSongs) {
      let songsIds = excludeIds;
      let views = [];
      let output = {};

      for (let i = 0; i < placedSongs.length && views.length < limit; i++) {
        let placedSong = placedSongs[i];
        let song = placedSong.get('song');
        offset++;

        if (!~songsIds.indexOf(song.id)) {
          let rate = taste.rate(song);
          songsIds.push(song.id);

          if (rate <= 0.5 && Math.random() > rate) continue;

          let view = placedSong.view();

          view.distance = placedSong.get('location').kilometersTo(location)*1000;
          view.distance = Math.round(view.distance);
          view.rate = rate;

          views.push(view);
        }
      }

      output.offset = offset;
      output.songs = views;

      return Parse.Promise.as(output);
    });
  }

}

Parse.Object.registerSubclass('PlacedSong', PlacedSong);