export default class Service {
  constructor(name) {
    this.name = name || 'itunes';
  }

  static get availableServices() {
    return [
      new Service('itunes'),
      new Service('spotify'),
      new Service('deezer')
    ];
  }

  // match
  match(song) {
    let term = '';

    switch (this.name) {
      case 'itunes':
        term = `${song.title} ${song.artist}`;
        break;
      case 'spotify':
        term = `track:${song.title} artist:${song.artist}`;
        break;
      case 'deezer':
        term = `track:"${song.title}" artist:"${song.artist}"`;
        break;
    }

    console.log(`Matching with term ${term}`);

    return this.search(term, 1).then(function(result) {
      return Parse.Promise.as(result[0]);
    });
  }

  // lookup
  lookup(id) {
    let request = {};

    switch (this.name) {
      case 'itunes':
        request.url = 'https://itunes.apple.com/lookup';
        request.params = {id: id, limit: 1};
        break;
      case 'spotify':
        request.url = 'https://api.spotify.com/v1/tracks/' + id;
        request.params = {};
        break;
      case 'deezer':
        request.url = 'http://api.deezer.com/track/' + id;
        request.params = {};
    }

    return Parse.Cloud.httpRequest(request).then(function(response) {
      if (response.status == 200) {
        let result = this.parseLookupResponse(response);

        if (result.id) {
          return Parse.Promise.as(result);
        } else {
          return Parse.Promise.error(`Song does not exist on service ${this.name}`);
        }
      } else {
        return Parse.Promise.error(`Could not connect to service ${this.name}`);
      }
    }.bind(this))
  }

  // search
  search(term, limit) {
    let request = {};

    switch (this.name) {
      case 'itunes':
        request.url = 'https://itunes.apple.com/search';
        request.params = {term: term, limit: limit, media: 'music'};
        break;
      case 'spotify':
        request.url = 'https://api.spotify.com/v1/search';
        request.params = {q: term, limit: limit, type: 'track'};
        break;
      case 'deezer':
        request.url = 'http://api.deezer.com/search/track/';
        request.params = {q: term};
        break;
    }

    return Parse.Cloud.httpRequest(request).then(function(response) {
      if (response.status == 200) {
        return Parse.Promise.as(this.parseSearchResponse(response));
      } else {
        return Parse.Promise.error(`Could not connect to service ${this.name}`);
      }
    }.bind(this));
  }

  // parseLookupResponse
  parseLookupResponse(response) {
    if (response.status) {
      response = JSON.parse(response.text);
    }

    let result = {};

    switch (this.name) {
      case 'itunes':
        response = response.results? response.results[0] : response;
        if (response) {
          result.id      = response.trackId;
          result.title   = response.trackName;
          result.artist  = response.artistName;
          result.cover   = response.artworkUrl100;
          result.preview = response.previewUrl;
          result.genre   = response.primaryGenreName;
          result.service = this.name;
        }
        break;
      case 'spotify':
        if (response) {
          result.id      = response.id;
          result.title   = response.name;
          result.artist  = response.artists[0].name;
          result.cover   = response.album.images[1].url;
          result.preview = response.preview_url;
          result.service = this.name;
        }
        break;
      case 'deezer':
        if (response) {
          result.id      = response.id;
          result.title   = response.title;
          result.artist  = response.artist.name;
          result.cover   = response.album.cover_medium;
          result.preview = response.preview;
          result.service = this.name;
        }
        break;
    }

    return result;
  }

  // parseSearchResponse
  parseSearchResponse(response) {
    if (response.status) {
      response = JSON.parse(response.text);
    }

    let result = [];

    switch (this.name) {
      case 'itunes':
        response = response.results;
        break;
      case 'spotify':
        response = response.tracks.items;
        break;
      case 'deezer':
        response = response.data;
        break;
    }

    for (var i = 0; i < response.length; i++) {
      result.push(this.parseLookupResponse(response[i]));
    }

    return result;
  }
}