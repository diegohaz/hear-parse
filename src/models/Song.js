import Artist from './Artist';

export default class Song extends Parse.Object {
  constructor() {
    super('Song');
  }

  schematize() {
    this.get('iTunesId')  || this.set('iTunesId', '');
    this.get('title')     || this.set('title', '');
    this.get('artist')    || this.set('artist', Artist.createWithoutData('null'));
    this.get('genres')    || this.set('genres', []);
    this.get('cover')     || this.set('cover', '');
    this.get('length')    || this.set('length', 0);
    this.get('preview')   || this.set('preview', '');
    this.get('services')  || this.set('services', {});

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  static beforeSave(request, response) {
    Parse.Cloud.useMasterKey();

    let song = request.object;

    song.schematize();

    let iTunesId = song.get('iTunesId');

    if (!iTunesId) return response.error('iTunesId empty');

    if (song.dirty('iTunesId')) {
      Parse.Cloud.httpRequest({
        url: 'https://itunes.apple.com/lookup',
        params: {id: iTunesId}
      }).then(function(httpResponse) {
        if (httpResponse.status = 200) {
          let results = JSON.parse(httpResponse.text).results;

          if (results.length) {
            let result = results[0];

            song.set('title', result.trackName);
            song.set('cover', result.artworkUrl100.replace('100x100', '{0}x{0}'));
            song.set('length', result.trackTimeMillis);
            song.set('preview', result.previewUrl);

            response.success();
          } else {
            response.error(`Track does not exist for id ${iTunesId}`);
          }
        } else {
          response.error(`Could not connect to iTunes with status ${httpResponse.status}`);
        }
      }, response.error);
    } else {
      response.success();
    }
  }
}

Parse.Object.registerSubclass('Song', Song);