export default class Artist extends Parse.Object {
  constructor() {
    super('Artist');
  }
}

Parse.Object.registerSubclass('Artist', Artist);