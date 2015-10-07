export default class Genre extends Parse.Object {
  constructor() {
    super('Genre');
  }
}

Parse.Object.registerSubclass('Genre', User);