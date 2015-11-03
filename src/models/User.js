import Service from './Service';

export default class User extends Parse.User {
	constructor() {
		super('_User');
	}

	// schematize
	schematize() {
		this.get('name') 			       || this.set('name', '');
		this.get('pictureUrl') 	     || this.set('pictureUrl', '');
		this.get('service') 	       || this.set('service', {name: 'itunes'});
    this.get('removedSongs')     || this.set('removedSongs', []);
    this.get('removedArtists')   || this.set('removedArtists', []);
    this.get('country')          || this.set('country', 'BR');
    this.get('locale')           || this.set('locale', 'pt');
	}

  // get service
  get service() {
    let service = this.get('service');

    return new Service(service? service.name : null);
  }

  // get removedSongs
  get removedSongs() {
    return this.get('removedSongs')? this.get('removedSongs') : [];
  }

  // get removedArtists
  get removedArtists() {
    return this.get('removedArtists')? this.get('removedArtists') : [];
  }

  // get country
  get country() {
    return this.get('country')? this.get('country') : 'BR';
  }

  // get locale
  get locale() {
    return this.get('locale')? this.get('locale') : 'pt';
  }

  // view
  view() {
    let view = {};

    view.id = this.id;
    view.name = this.get('name');
    view.pictureUrl = this.get('pictureUrl');

    return view;
  }

  // get current
  static get current() {
    let currentUser = Parse.User.current()? Parse.User.current() : User.createWithoutData('EBAL5Jka3s');

    return currentUser;
  }

	// beforeSave
	static beforeSave(request, response) {
		let user = request.object;

		user.schematize();

		response.success();
	}
}

Parse.Object.registerSubclass('_User', User);