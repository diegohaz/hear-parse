import User from './User';
import Song from './Song';
import _ from 'underscore';

export default class SongRate extends Parse.Object {
  constructor() {
    super('SongRate');
  }

  // schematize
  schematize() {
    this.get('user')       || this.set('user', User.createWithoutData('null'));
    this.get('song')       || this.set('song', Song.createWithoutData('null'));
    this.get('playbacks')  || this.set('playbacks', 0);
    this.get('totalTime')  || this.set('totalTime', 0);
    this.get('playedTime') || this.set('playedTime', 0);
    this.get('removed')    || this.set('removed', false);
    this.get('rate')       || this.set('rate', 0);

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let rate = request.object;

    rate.schematize();

    if (!rate.get('user')) return response.error('Empty user');
    if (!rate.get('song')) return response.error('Empty song');

    if (rate.get('removed')) {
      rate.set('rate', 0);
    } else if (rate.dirty('playedTime') || rate.dirty('totalTime')) {
      rate.set('rate', rate.get('playedTime') / rate.get('totalTime'));
    }

    response.success();
  }

  // process
  static process(playbacks) {
    let user = User.current();

    if (!user) return Parse.Promise.error('Empty user');

    let songIds = _.map(playbacks, playback => playback.songId);
    let songQuery = new Parse.Query(Song);
    let rateQuery = new Parse.Query(SongRate);

    songQuery.containedIn('objectId', songIds);

    rateQuery.include(['song', 'song.artist', 'song.genre']);
    rateQuery.equalTo('user', user);
    rateQuery.matchesQuery(songQuery);

    return rateQuery.find().then(function(rates) {
      let foundIds = _.map(rates, rate => rate.get('song').id);

      _.each(playbacks, playback => {
        let id = playback.songId;
        let rate;

        if (~foundIds.indexOf(id)) {
          rate = _.find(rates, rate => rate.get('song').id == id);
        } else {
          rate = new SongRate;

          foundIds.push(id);
          rates.push(rate);
        }

        rate.increment('playbacks');
        rate.increment('totalTime', playback.totalTime);
        rate.increment('playedTime', playback.playedTime);
      });

      return Parse.Object.saveAll(rates);
    });
  }
}

Parse.Object.registerSubclass('SongRate', SongRate);