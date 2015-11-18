import User from './User';
import Artist from './Artist';
import PlacedSong from './PlacedSong';
import _ from 'underscore';

export default class Taste {
  constructor(playbacks, user = null) {
    this.user = user;
    this.songs = _.groupBy(playbacks, p => p.get('song').id);
    this.artists = _.groupBy(playbacks, p => p.get('song').get('artist').id);
    this.genres = _.groupBy(playbacks, p => p.get('song').get('genre').id);

    this.removedSongs = user? user.get('removedSongs') : [];
  }

  // rate
  rate(song) {
    if (~this.removedSongs.indexOf(song.id)) return 0;

    if (this.songs[song.id]) {
      let playbacks = this.songs[song.id];
      let songRate = _.reduce(playbacks, (memo, playback) => {
        let playbackRate = playback.get('rate');

        playbackRate += playback.get('placed') * 5;
        playbackRate += playback.get('saved') * 1;
        playbackRate += playback.get('chosen') * 0.3;

        return memo + playbackRate;
      }, 0) / playbacks.length;

      if (playbacks.length == 1 && songRate < 0.5) {
        songRate = 0.5;
      }

      return songRate;
    } else {
      let artistId = song.get('artist').id;
      let genreId = song.get('genre').id;
      let hasArtist = !!this.artists[artistId];
      let hasGenre = !!this.genres[genreId];

      if (!hasArtist && !hasGenre) return 1;

      let id = hasArtist? artistId : genreId;
      let key = hasArtist? 'artists' : 'genres';
      let threshold = hasArtist? 3 : 10;
      let playbacks = this[key][id];
      let songs = _.map(_.groupBy(playbacks, p => p.get('song').id), g => g[0].get('song'));

      if (songs.length < threshold) return 1;

      return _.reduce(songs, (memo, s) => memo + this.rate(s), 0) / songs.length;
    }
  }


}