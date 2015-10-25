import Genre from './Genre';
import User from './User';
import Service from './Service';

export default class Song extends Parse.Object {
  constructor() {
    super('Song');
  }

  // schematize
  schematize() {
    this.get('title')  || this.set('title', '');
    this.get('artist') || this.set('artist', '');

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // view
  view() {
    let view = {};
    let service = User.currentService.name;

    view.id      = this.get(service).id;
    view.title   = this.get('title');
    view.artist  = this.get('artist');
    view.cover   = this.get(service).cover;
    view.preview = this.get(service).preview;
    view.service = service;
    view.serviceUrl = this.get(service).url;

    return view;
  }

  // setService
  setService(serviceName, data) {
    this.set(serviceName, {
      id: '' + data.id,
      cover: data.cover,
      preview: data.preview,
      url: data.serviceUrl
    });
  }

  // fetchFromService
  fetchFromService(service, id) {
    let song = this;
    let result;

    return service.lookup(id).then(function(response) {
      result = response;

      if (song.get('genre')) {
        return Parse.Promise.as(song.get('genre'));
      } else {
        return Genre.create(result.genre);
      }
    }).then(function(genre) {
      song.get('title')  || song.set('title', result.title);
      song.get('artist') || song.set('artist', result.artist);
      song.get('genre')  || song.set('genre', genre);
      song.setService(service.name, result);

      return Parse.Promise.as();
    });
  }

  // beforeSave
  static beforeSave(request, response) {
    Parse.Cloud.useMasterKey();

    let song = request.object;

    song.schematize();
    response.success();
  }

  // afterSave
  static afterSave(request) {
    Parse.Cloud.useMasterKey();

    let song = request.object;
    let services = Service.availableServices;
    let promises = [];

    for (var i = 0; i < services.length; i++) {
      let service = services[i];

      if (!song.get(service.name)) {
        promises.push(service.match(song.view()));
      }
    }

    if (promises.length) {
      Parse.Promise.when(promises).then(function() {
        for (var i = 0; i < arguments.length; i++) {
          let match = arguments[i];
          console.log(`Setting match ${match.title}`);

          if (match) {
            song.setService(match.service, match);
          }
        }

        song.save();
      });
    }
  }

  // create
  static create(service, id) {
    Parse.Cloud.useMasterKey();

    let songs = new Parse.Query(Song);

    songs.include('genre');
    songs.exists(`${service.name}`);
    songs.equalTo(`${service.name}.id`, id);

    return songs.first().then(function(song) {
      if (song) {
        return Parse.Promise.as(song);
      } else {
        song = new Song;
        return song.fetchFromService(service, id).then(function() {
          return song.save();
        });
      }
    });
  }

  // search
  static search(service, string, limit = 10) {
    return service.search(string, limit);
  }
}

Parse.Object.registerSubclass('Song', Song);