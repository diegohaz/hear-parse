export default class Genre extends Parse.Object {
  constructor() {
    super('Genre');
  }

  // schematize
  schematize() {
    this.get('name') || this.set('name', '');

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

    let genres = new Parse.Query(Genre);

    genres.equalTo('name', name);

    return genres.first().then(function(genre) {
      if (genre) {
        return Parse.Promise.as(genre);
      } else {
        genre = new Genre;
        genre.set('name', name);

        return genre.save();
      }
    });
  }
}

Parse.Object.registerSubclass('Genre', Genre);