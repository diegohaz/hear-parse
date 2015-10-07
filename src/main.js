import User from './models/User';

Parse.Cloud.beforeSave('_User', User.beforeSave);