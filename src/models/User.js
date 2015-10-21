import Service from './Service';

export default class User extends Parse.Object {
	constructor() {
		super('_User');
	}

	// schematize
	schematize() {
		this.get('name') 			 || this.set('name', '');
		this.get('picture') 	 || this.set('picture', '');
		this.get('service') 	 || this.set('service', null);
		this.get('identified') || this.set('identified', false);
		this.get('genres')     || this.set('genres', []);
	}

	// beforeSave
	static beforeSave(request, response) {
		let user = request.object;

		user.schematize();

		response.success();
	}

	// get service
	static get currentService() {
		let user = Parse.User.current();
		let service = user? user.get('service') : 'itunes';

		return new Service(service? service.name : null)
	}
}

Parse.Object.registerSubclass('_User', User);