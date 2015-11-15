import User from './User';
import Song from './Song';
import Taste from './Taste';
import _ from 'underscore';

export default class SongRate extends Parse.Object {
  constructor() {
    super('SongRate');
  }

  // schematize
  schematize() {
    this.get('user')        || this.set('user', User.createWithoutData('null'));
    this.get('song')        || this.set('song', Song.createWithoutData('null'));
    this.get('playbacks')   || this.set('playbacks', 0);
    this.get('totalTime')   || this.set('totalTime', 0);
    this.get('playedTime')  || this.set('playedTime', 0);
    this.get('placedCount') || this.set('placedCount', 0);
    this.get('removed')     || this.set('removed', false);
    this.get('rate')        || this.set('rate', 0);

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let rate = request.object;

    rate.schematize();

    if (!rate.get('user')) return response.error('Empty user');
    if (!rate.get('song')) return response.error('Empty song');

    rate.set('rate', rate.get('playedTime') / rate.get('totalTime'));
    rate.increment('rate', rate.get('placedCount'));

    if (rate.get('removed')) {
      rate.set('rate', 0);
    }

    response.success();
  }

  // create
  static create(songId) {
    let user = User.current();

    if (!user) return Parse.Promise.error('Empty user');

    let rates = new Parse.Query(SongRate);

    rates.equalTo('user', user);
    rates.equalTo('song', Song.createWithoutData(songId));

    return rates.first().then(function(rate) {
      if (!rate) {
        let rate = new SongRate;

        rate.set('user', user);
        rate.set('song', Song.createWithoutData(songId));
      }

      return Parse.Promise.as(rate);
    });
  }

  // place
  static place(songId) {
    return SongRate.create(songId).then(function(rate) {
      rate.increment('placedCount');

      return rate.save(null, {useMasterKey: true});
    });
  }

  // remove
  static remove(songId) {
    return SongRate.create(songId).then(function(rate) {
      rate.set('removed', true);

      return rate.save(null, {useMasterKey: true});
    });
  }

  // taste
  static taste(object, location = null, radius = 100) {
    let rates = new Parse.Query(SongRate);

    rates.include(['user', 'song', 'song.artist', 'song.genre']);
    rates.greaterThanOrEqualTo('playbacks', 3);

    if (object && object.className == '_User') {
      rates.equalTo('user', object);
    } else if (object && object.className == 'Song') {
      rates.equalTo('song', song);
    }

    if (location && location.latitude) {
      let location = new Parse.GeoPoint(location.latitude, location.longitude);
      let userQuery = new Parse.Query(User);

      userQuery.withinKilometers('location', location, radius);
      rates.matchesQuery('user', userQuery);
    }

    return rates.find().then(function(rates) {
      return Parse.Promise.as(new Taste(rates));
    });
  }

  // process
  static process(playbacks) {
    Parse.Cloud.useMasterKey();

    let user = User.current();
    playbacks = _.filter(playbacks, p => p.playedTime/p.totalTime > 0.1);

    if (!user) return Parse.Promise.error('Empty user');
    if (!playbacks.length) return Parse.Promise.error('Nothing to process');

    let songIds = _.map(playbacks, playback => playback.songId);
    let rateQuery = new Parse.Query(SongRate);
    let userQuery = new Parse.Query(Song);

    userQuery.containedIn('objectId', songIds);

    rateQuery.matchesQuery('song', userQuery);
    rateQuery.equalTo('user', user);

    return rateQuery.find().then(function(rates) {
      let foundIds = _.map(rates, rate => rate.get('song').id);

      _.each(playbacks, playback => {
        let id = playback.songId;
        let rate;

        if (~foundIds.indexOf(id)) {
          rate = _.find(rates, rate => rate.get('song').id == id);
        } else {
          rate = new SongRate;
          rate.set('user', user);
          rate.set('song', Song.createWithoutData(id));

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