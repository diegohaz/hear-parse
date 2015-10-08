import Song from './Song';

export default class SongPost extends Parse.Object {
  constructor() {
    super('SongPost');
  }

  // schematize
  schematize() {
    this.get('song')      || this.set('song', Song.createWithoutData('null'));
    this.get('location')  || this.set('location', new Parse.GeoPoint());

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let songPost = request.object;

    songPost.schematize();

    if (!songPost.get('song')) return response.error('Empty song');
    if (!songPost.get('location')) return response.error('Empty location');

    response.success();
  }

  // Post
  static post(iTunesId, location) {
    Parse.Cloud.useMasterKey();

    return Song.create(iTunesId).then(function(song) {
      let songPost = new SongPost;

      songPost.set('song', song);
      songPost.set('location', location);

      return songPost.save();
    });
  }

  // list
  static list(location, limit = 30, skip = 0) {
    let songPosts = new Parse.Query(SongPost);

    songPosts.include(['song', 'song.artist']);
    songPosts.near('location', location);
    songPosts.withinKilometers('location', location, 20000);
    songPosts.limit(limit * 10);
    songPosts.skip(skip);

    return songPosts.find().then(function(songPosts) {
      let songsIds = [];
      let songsToReturn = [];
      let results = {};

      for (let i = 0; i < songPosts.length && songsToReturn.length < 30; i++) {
        let songPost = songPosts[i];
        let song = songPost.get('song');
        skip++;

        if (!~songsIds.indexOf(song.id)) {
          let songToReturn = {};

          songToReturn.id       = song.get('iTunesId');
          songToReturn.title    = song.get('title');
          songToReturn.artist   = song.get('artist').get('name');
          songToReturn.cover    = song.get('cover');
          songToReturn.preview  = song.get('preview');
          songToReturn.distance = songPost.get('location').kilometersTo(location)*1000;

          songsIds.push(song.id);
          songsToReturn.push(songToReturn);
        }
      }

      results.nextPage = skip;
      results.songs = songsToReturn;

      return Parse.Promise.as(results);
    });
  }

}

Parse.Object.registerSubclass('SongPost', SongPost);