import User from './User';
import Song from './Song';
import Taste from './Taste';

export default class Playback extends Parse.Object {
  constructor() {
    super('Playback');
  }

  // schematize
  schematize() {
    this.get('song')     || this.set('song', Song.createWithoutData('null'));
    this.get('user')     || this.set('user', User.current());
    this.get('location') || this.set('location', new Parse.GeoPoint());
    this.get('rate')     || this.set('rate', 0);
    this.get('placed')   || this.set('placed', false);

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let playback = request.object;

    if (!playback.get('song')) return response.error('Empty song');
    if (!playback.get('location')) return response.error('Empty location');

    playback.schematize();

    if (!playback.get('user')) return response.error('Empty user');

    response.success();
  }

  // taste
  static taste(user = null, song = null, location = null) {
    let playbacks = new Parse.Query(Playback);

    if (user) playbacks.equalTo('user', user);
    if (song) playbacks.equalTo('song', song);
    if (location) {
      playbacks.near('location', location);
      playbacks.withinKilometers('location', location, 20000);
    }

    playbacks.include(['user', 'song', 'song.artist', 'song.genre']);
    playbacks.descending('createdAt');

    return playbacks.find().then(function(playbacks) {
      return Parse.Promise.as(new Taste(playbacks, user));
    });
  }
}

Parse.Object.registerSubclass('Playback', Playback);