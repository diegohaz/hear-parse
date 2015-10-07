export default class User extends Parse.Object {
	constructor() {
		super('_User');
	}

	static beforeSave(request, response) {
		let user = request.object;

		user.get('name') 				|| user.set('name', '');
		user.get('picture') 		|| user.set('picture', '');
		user.get('services') 		|| user.set('services', {});
		user.get('identified')	|| user.set('anonymous', false);
		user.set('deleted', false);

		response.success();
	}
}

Parse.Object.registerSubclass('_User', User);