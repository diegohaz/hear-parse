Parse.Cloud.define('test', function(request, response) {
  let result = [];

  result.push('TESTING FETCH PLACE');

  Parse.Cloud.run('fetchPlace', {latitude: -22.9492577, longitude: -43.1932283}).then(function(res) {
    result.push(res);

    return Parse.Promise.as();
  }, function(error) {
    result.push(`fetchPlace failed with error ${error}`);

    return Parse.Promise.as();
  }).then(function() {
    result.push('TESTING SEARCH SONG');

    return Parse.Cloud.run('searchSong', {string: 'Queen', limit: 1})
  }).then(function(res) {
    result.push(res);

    return Parse.Promise.as();
  }, function(error) {
    result.push(`searchSong failed with error "${error}"`);

    return Parse.Promise.as();
  }).always(function() {
    response.success(result);
  });
});