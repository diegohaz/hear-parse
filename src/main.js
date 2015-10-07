import User from './models/User';
import Song from './models/Song';

Parse.Cloud.beforeSave('_User', User.beforeSave);
Parse.Cloud.beforeSave('Song', Song.beforeSave);