export default class Artist extends Parse.Object {
	constructor() {
		super('Artist');
	}

	// schematize
	schematize() {
		this.get('iTunesId')	|| this.set('iTunesId', 0);
		this.get('name') 			|| this.set('name', '');

		this.setACL(new Parse.ACL({'*': {'read': true}}));
	}

	// beforeSave
	static beforeSave(request, response) {
    let artist = request.object;

    artist.schematize();

    if (!artist.get('iTunesId')) return response.error('Empty iTunesId');
    if (!artist.get('name')) return response.error('Empty name');

    response.success();
	}

	// create
	static create(iTunesId, name) {
		Parse.Cloud.useMasterKey();

		let artists = new Parse.Query(Artist);

		artists.equalTo('iTunesId', iTunesId);

		return artists.first().then(function(artist) {
			if (artist) {
				return Parse.Promise.as(artist);
			} else {
				artist = new Artist;
				artist.set('iTunesId', iTunesId);
				artist.set('name', name);

				return artist.save();
			}
		});
	}
}

Parse.Object.registerSubclass('Artist', Artist);