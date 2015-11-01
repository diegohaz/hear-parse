import Artist from './Artist';
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
    this.get('artist') || this.set('artist', new Artist);
    this.get('genre')  || this.set('genre', new Genre);

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // view
  view() {
    let view = {};
    let service = User.current.service.name;

    view.songId     = this.id;
    view.title      = this.get('title');
    view.artist     = this.get('artist').view();
    view.previewUrl = this.get(service).previewUrl;
    view.service    = service;
    view.serviceId  = this.get(service).id;
    view.serviceUrl = this.get(service).url;
    view.images     = this.get(service).images;

    return view;
  }

  // setService
  setService(serviceName, data) {
    this.set(serviceName, {
      id: '' + data.serviceId,
      previewUrl: data.previewUrl,
      url: data.serviceUrl,
      images: data.images
    });
  }

  // fetchFromService
  fetchFromService(service, id) {
    let song = this;
    let result, genre;

    return service.lookup(id).then(function(response) {
      result = response;

      if (song.get('genre')) {
        return Parse.Promise.as(song.get('genre'));
      } else {
        return Genre.create(result.genre);
      }
    }).then(function(response) {
      genre = response;

      if (song.get('artist')) {
        return Parse.Promise.as(song.get('artist'));
      } else {
        return Artist.create(result.artist);
      }
    }).then(function(artist) {
      song.get('title')  || song.set('title', result.title);
      song.get('artist') || song.set('artist', artist);
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
    let genre;

    song.get('artist').fetch().then(function() {
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

            if (!match) continue;

            console.log(`Setting match ${match.title}`);
            genre = genre || match.genre;
            song.setService(match.service, match);
          }

          if (!song.get('genre') && genre) {
            return Genre.create(genre);
          } else {
            return Parse.Promise.as(song.get('genre'));
          }
        }).then(function(genre) {
          song.set('genre', genre);
          song.save();
        });
      }
    });
  }

  // create
  static create(service, id) {
    Parse.Cloud.useMasterKey();

    let songs = new Parse.Query(Song);

    songs.include(['genre', 'artist']);
    songs.exists(service.name);
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