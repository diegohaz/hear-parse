import Song from './Song';
import User from './User';
import moment from 'moment/min/moment-with-locales.min';

export default class SongPost extends Parse.Object {
  constructor() {
    super('SongPost');
  }

  // schematize
  schematize() {
    this.get('user')     || this.set('user', User.createWithoutData('null'));
    this.get('song')     || this.set('song', Song.createWithoutData('null'));
    this.get('story')    || this.set('story', '');
    this.get('location') || this.set('location', new Parse.GeoPoint());

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let songPost = request.object;

    songPost.schematize();

    if (!songPost.get('user')) return response.error('Empty user');
    if (!songPost.get('song')) return response.error('Empty song');
    if (!songPost.get('location')) return response.error('Empty location');

    response.success();
  }

  // Post
  static post(id, location) {
    Parse.Cloud.useMasterKey();

    return Song.create(User.currentService, id).then(function(song) {
      let songPost = new SongPost;

      songPost.set('user', Parse.User.current());
      songPost.set('song', song);
      songPost.set('location', location);

      return songPost.save().then(function(songPost) {
        let view = song.view();

        return Parse.Promise.as(view);
      });
    });
  }

  // list
  static list(location, limit = 22, skip = 0) {
    let songPosts = new Parse.Query(SongPost);

    songPosts.include(['song', 'song.genre']);
    songPosts.near('location', location);
    songPosts.withinKilometers('location', location, 20000);
    songPosts.limit(limit * 10);
    songPosts.skip(skip);

    return songPosts.find().then(function(songPosts) {
      let songsIds = [];
      let views = [];
      let results = {};

      for (let i = 0; i < songPosts.length && views.length < limit; i++) {
        let songPost = songPosts[i];
        let song = songPost.get('song');
        skip++;

        if (!~songsIds.indexOf(song.id)) {
          let view = song.view();

          view.distance = songPost.get('location').kilometersTo(location)*1000;
          view.distance = Math.round(view.distance);

          songsIds.push(song.id);
          views.push(view);
        }
      }

      results.nextPage = skip;
      results.songs = views;

      return Parse.Promise.as(results);
    });
  }

}

Parse.Object.registerSubclass('SongPost', SongPost);