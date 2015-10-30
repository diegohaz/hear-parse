import Service from './Service';

export default class User extends Parse.Object {
	constructor() {
		super('_User');
	}

	// schematize
	schematize() {
		this.get('name') 			   || this.set('name', '');
		this.get('picture') 	   || this.set('picture', '');
		this.get('service') 	   || this.set('service', {name: 'itunes'});
		this.get('identified')   || this.set('identified', false);
    this.get('genres')       || this.set('genres', []);
    this.get('removedSongs') || this.set('removedSongs', []);
    this.get('country')      || this.set('country', 'US');
    this.get('locale')       || this.set('locale', 'en');
	}

	// beforeSave
	static beforeSave(request, response) {
		let user = request.object;

		user.schematize();

		response.success();
	}

	// get currentService
	static get currentService() {
		let user = Parse.User.current();
		let service = user? user.get('service') : 'itunes';

		return new Service(service? service.name : null)
	}

  // get removedSongs
  static get removedSongs() {
    let user = Parse.User.current();
    let removedSongs = user? user.get('removedSongs') : [];

    return removedSongs;
  }

  // get country
  static get country() {
    let user = Parse.User.current();
    let country = user? user.get('country') : 'US';

    return country;
  }

  // get locale
  static get locale() {
    let user = Parse.User.current();
    let locale = user? user.get('locale') : 'en';

    return locale;
  }
}

Parse.Object.registerSubclass('_User', User);