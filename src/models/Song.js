import Artist from './Artist';
import Genre from './Genre';

export default class Song extends Parse.Object {
  constructor() {
    super('Song');
  }

  // schematize
  schematize() {
    this.get('iTunesId')  || this.set('iTunesId', 0);
    this.get('title')     || this.set('title', '');
    this.get('artist')    || this.set('artist', Artist.createWithoutData('null'));
    this.get('genre')     || this.set('genre', Genre.createWithoutData('null'));
    this.get('cover')     || this.set('cover', '');
    this.get('preview')   || this.set('preview', '');
    this.get('services')  || this.set('services', {});

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // setup
  setup(iTunesId) {
    let result, artist, song = this;

    iTunesId = iTunesId || this.get('iTunesId');

    return Parse.Cloud.httpRequest({
      url: 'https://itunes.apple.com/lookup',
      params: {id: iTunesId, limit: 1}
    }).then(function(response) {
      if (response.status == 200) {
        let results = JSON.parse(response.text).results;

        if (results.length) {
          result = results[0];

          return Artist.create(result.artistId, result.artistName);
        } else {
          return Parse.Promise.error('Song does not exist on iTunes');
        }
      } else {
        return Parse.Promise.error('Could not connect to iTunes');
      }
    }).then(function(response) {
      artist = response;

      return Genre.create(result.primaryGenreName);
    }).then(function(genre) {
      song.set('title', result.trackName);
      song.set('artist', artist);
      song.set('cover', result.artworkUrl100);
      song.set('preview', result.previewUrl);
      song.set('genre', genre);

      return Parse.Promise.as();
    });
  }

  // beforeSave
  static beforeSave(request, response) {
    Parse.Cloud.useMasterKey();

    let song = request.object;

    if (!song.get('iTunesId')) return response.error('Empty iTunesId');

    song.schematize();

    if (song.dirty('iTunesId')) {
      song.setup().then(response.success, response.error);
    } else {
      response.success();
    }
  }

  // create
  static create(iTunesId) {
    Parse.Cloud.useMasterKey();

    let songs = new Parse.Query(Song);

    songs.equalTo('iTunesId', iTunesId);

    return songs.first().then(function(song) {
      if (song) {
        return Parse.Promise.as(song);
      } else {
        song = new Song;
        song.set('iTunesId', iTunesId);

        return song.save();
      }
    });
  }

  // search
  static search(string, limit = 10) {
    return Parse.Cloud.httpRequest({
      url: 'https://itunes.apple.com/search',
      params: {term: string, media: 'music', limit: limit}
    }).then(function(response) {
      if (response.status == 200) {
        let results = JSON.parse(response.text).results;
        let songs = [];

        for (let i = 0; i < results.length; i++) {
          let result = results[i];
          let song = {};

          song.id = result.trackId;
          song.title = result.trackName;
          song.artist = result.artistName;
          song.cover = result.artworkUrl100;
          song.preview = result.previewUrl;

          songs.push(song);
        }

        return Parse.Promise.as(songs);
      } else {
        return Parse.Promise.error('Could not connect to iTunes');
      }
    });
  }
}

Parse.Object.registerSubclass('Song', Song);