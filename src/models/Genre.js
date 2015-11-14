import User from './User';

export default class Genre extends Parse.Object {
  constructor() {
    super('Genre');
  }

  // schematize
  schematize() {
    this.get('name')      || this.set('name', '');
    this.get('countries') || this.set('countries', []);

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // beforeSave
  static beforeSave(request, response) {
    let genre = request.object;

    genre.schematize();

    if (!genre.get('name')) return response.error('Empty name');

    response.success();
  }

  // create
  static create(name) {
    Parse.Cloud.useMasterKey();

    if (!name) {
      return Parse.Promise.as();
    }

    let genres = new Parse.Query(Genre);

    genres.equalTo('name', name);

    return genres.first().then(function(genre) {
      if (genre) {
        let countries = genre.get('countries');

        if (~countries.indexOf(User.current.country)) {
          return Parse.Promise.as(genre);
        } else {
          genre.addUnique('countries', User.current.country);
          return genre.save();
        }
      } else {
        genre = new Genre;
        genre.set('name', name);
        genre.set('countries', [User.current.country]);

        return genre.save();
      }
    });
  }
}

Parse.Object.registerSubclass('Genre', Genre);