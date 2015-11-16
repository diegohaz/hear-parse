export default class Beacon extends Parse.Object {
  constructor() {
    super('Beacon');
  }

  // schematize
  schematize() {
    this.get('uuid') || this.set('uuid', '');
    this.get('name') || this.set('name', '');

    let acl = new Parse.ACL(User.current());
    acl.setPublicReadAccess(true)

    this.setACL(acl);
  }

  // beforeSave
  static beforeSave(request, response) {
    let beacon = request.object;

    if (!beacon.get('uuid')) return response.error('Empty uuid');

    beacon.schematize();
    response.success();
  }

  // create
  static get(uuid) {
    if (!uuid) {
      return Parse.Promise.as();
    }

    let beacons = new Parse.Query(Beacon);

    beacons.equalTo('uuid', uuid);

    return beacons.first();
  }
}

Parse.Object.registerSubclass('Beacon', Beacon);