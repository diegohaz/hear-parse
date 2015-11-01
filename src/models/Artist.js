export default class Artist extends Parse.Object {
  constructor() {
    super('Artist');
  }

  // schematize
  schematize() {
    this.get('name') || this.set('name', '');

    this.setACL(new Parse.ACL({'*': {'read': true}}));
  }

  // view
  view() {
    let view = {};

    view.id = this.id;
    view.name = this.get('name');

    return view;
  }

  // beforeSave
  static beforeSave(request, response) {
    let artist = request.object;

    artist.schematize();

    if (!artist.get('name')) return response.error('Empty name');

    response.success();
  }

  // create
  static create(name) {
    Parse.Cloud.useMasterKey();

    if (!name) {
      return Parse.Promise.as();
    }

    let artists = new Parse.Query(Artist);

    artists.equalTo('name', name);

    return artists.first().then(function(artist) {
      if (artist) {
        return Parse.Promise.as(artist);
      } else {
        artist = new Artist;
        artist.set('name', name);

        return artist.save();
      }
    });
  }
}

Parse.Object.registerSubclass('Artist', Artist);