export default class User extends Parse.Object {
	constructor() {
		super('_User');
	}

	// schematize
	schematize() {
		this.get('name') 				|| this.set('name', '');
		this.get('picture') 		|| this.set('picture', '');
		this.get('services') 		|| this.set('services', {});
		this.get('identified')	|| this.set('identified', false);
		this.get('genres')			|| this.set('genres', []);
		this.get('artists')			|| this.set('artists', []);
	}

	// beforeSave
	static beforeSave(request, response) {
		let user = request.object;

		user.schematize();

		response.success();
	}
}

Parse.Object.registerSubclass('_User', User);