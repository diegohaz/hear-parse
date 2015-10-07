export default class User extends Parse.Object {
  constructor() {
    super('_User');
  }
}

Parse.Object.registerSubclass('_User', User);