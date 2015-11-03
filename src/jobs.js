import _ from 'underscore';

Parse.Cloud.job('getOldPlacedSongs', function(request, status) {
  let i = 0;

  Parse.Cloud.httpRequest({
    url: 'https://api.parse.com/1/classes/SongPost',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'YoKGeRRzGizxpkXM6V11kfaV6iX3KXt7QSJeNeXR',
      'X-Parse-REST-API-Key': 'WqrWs9Y0Cw4GJNn9ZLvkpgh81N4Wj3WU77xu570P'
    },
    params: {
      include: 'song',
      limit: request.params.limit || 100,
      skip: request.params.skip || 0
    }
  }).then(function(response) {
    let results = response.data.results;
    let promise = Parse.Promise.as();

    _.each(results, function(result) {
      if (!result.song.itunes || !result.song.itunes.id) {
        return
      }

      let latitude = result.location.latitude;
      let longitude = result.location.longitude;
      let iTunesId = result.song.itunes.id;

      promise = promise.always(function() {
        status.message(`${++i} processed`);
        return Parse.Cloud.run('placeSong', {
          serviceId: iTunesId,
          latitude: latitude,
          longitude: longitude
        })
      })
    });

    return promise;
  }).always(function() {
    status.success(`${i} processed`);
  });
});