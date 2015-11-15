import User from './User';
import Artist from './Artist';
import SongRate from './SongRate';
import _ from 'underscore';

export default class Taste {
  constructor(rates) {
    this.rates = rates;
  }

  // rate
  rate(song) {
    let rate = _.find(this.rates, rate => rate.get('song').id == song.id);

    if (!rate) {
      let artistRate = this.rateArtist(song.get('artist'));
      let genreRate = this.rateGenre(song.get('genre'));

      return artistRate > 0? (artistRate + genreRate) / 2 : 0;
    } else {
      return rate.get('rate');
    }
  }

  // artist
  rateArtist(artist) {
    let rates = _.filter(this.rates, rate => rate.get('song').get('artist').id == artist.id);

    if (!rates.length) return 1;

    let rate = _.reduce(rates, (memo, rate) => memo + rate.get('rate'), 0) / rates.length;

    return rate > 0? rate : Math.max(0, 0.3 - rates.length/10);
  }

  // genre
  rateGenre(genre) {
    let rates = _.filter(this.rates, rate => rate.get('song').get('genre').id == genre.id);

    if (!rates.length) return 1;

    let rate = _.reduce(rates, (memo, rate) => memo + rate.get('rate'), 0) / rates.length;

    return rate > 0? rate : Math.max(-0.5, 1 - rates.length/10);
  }

  // topSongs
  topSongs(limit = 10, excludePlacedSongs = false) {
    let rates = _.sortBy(this.rates, rate => rate.get('rate')).reverse();

    if (excludePlacedSongs) {
      rates = _.filter(rates, rate => rate.get('rate') <= 1);
    }

    rates = rates.slice(0, limit);

    return _.map(rates, rate => rate.get('song'));
  }

  // topArtists
  topArtists(limit) {
    let artists = _.groupBy(this.rates, rate => rate.get('song').get('artist').id);

    artists = _.sortBy(artists, rates => {
      return _.reduce(rates, (memo, rate) => memo + rate.get('rate'), 0) / rates.length;
    });

    return _.map(artists, rates => rates[0].get('artist')).slice(0, limit);
  }

  // topGenres
  topGenres(limit) {
    let genres = _.groupBy(this.rates, rate => rate.get('song').get('genre').id);

    genres = _.sortBy(genres, rates => {
      return _.reduce(rates, (memo, rate) => memo + rate.get('rate'), 0) / rates.length;
    });

    return _.map(genres, rates => rates[0].get('genre')).slice(0, limit);
  }


}