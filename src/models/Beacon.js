export default class Beacon extends Parse.Object {
  constructor() {
    super('Beacon');
  }

  // schematize
  schematize() {
    this.get('uuid') || this.set('uuid', '');
    this.get('name') || this.set('name', '');
  }

  // beforeSave
  static beforeSave(request, response) {
    let beacon = request.object;

    beacon.schematize();

    if (!beacon.get('uuid')) return response.error('Empty uuid');

    response.success();
  }

  // create
  static create(uuid) {
    Parse.Cloud.useMasterKey();

    if (!uuid) {
      return Parse.Promise.as();
    }

    let beacons = new Parse.Query(Beacon);

    beacons.equalTo('uuid', uuid);

    return beacons.first().then(function(beacon) {
      if (beacon) {
        return Parse.Promise.as(beacon);
      } else {
        beacon = new Beacon;
        beacon.set('uuid', uuid);

        return beacon.save();
      }
    });
  }
}

Parse.Object.registerSubclass('Beacon', Beacon);