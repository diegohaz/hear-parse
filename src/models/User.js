import Service from './Service';
import Playback from './Playback';

export default class User extends Parse.User {
	constructor() {
		super('_User');
	}

  // get service
  get service() {
    let service = this.get('service');

    return new Service(service? service.name : null);
  }

	// schematize
	schematize() {
		this.get('name') 			   || this.set('name', '');
		this.get('pictureUrl') 	 || this.set('pictureUrl', '');
		this.get('service') 	   || this.set('service', {name: 'itunes'});
    this.get('removedSongs') || this.set('removedSongs', []);
    this.get('country')      || this.set('country', 'BR');
    this.get('language')     || this.set('language', 'pt');
    this.get('location')     || this.set('location', new Parse.GeoPoint());
	}

  // view
  view() {
    let view = {};

    view.id = this.id;
    view.name = this.get('name');
    view.pictureUrl = this.get('pictureUrl');

    return view;
  }

  // taste
  taste() {
    return Playback.taste(this);
  }

	// beforeSave
	static beforeSave(request, response) {
		let user = request.object;

		user.schematize();

		response.success();
	}
}

Parse.Object.registerSubclass('_User', User);