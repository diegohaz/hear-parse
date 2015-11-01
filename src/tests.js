let latitudeMin = -23;
let latitudeMax = -22.8;
let longitudeMin = -43.3;
let longitudeMax = -43.1;

function randomLocation() {
  let location = {
    latitude: Math.random() * (latitudeMax - latitudeMin) + latitudeMin,
    longitude: Math.random() * (longitudeMax - longitudeMin) + longitudeMin
  };

  return location;
}

Parse.Cloud.define('testFetchPlace', function(request, response) {
  let params = randomLocation();
  Parse.Cloud.run('fetchPlace', params).then(response.success, response.error);
});

Parse.Cloud.define('testSearchSong', function(request, response) {
  let params = {
    string: 'Queen',
    limit: 3
  };

  Parse.Cloud.run('searchSong', params).then(response.success, response.error);
});

Parse.Cloud.define('testListPlacedSongs', function(request, response) {
  let result = [];

  Parse.Cloud.run('testPlaceSong').then(function(song) {
    let songId = song.songId;
    let params = randomLocation();

    params.excludeIds = [songId];

    result.push(`Ignoring ${song.title}`);

    return Parse.Cloud.run('listPlacedSongs', params);
  }).then(function(res) {
    result.push(res);

    response.success(result);
  }, response.error);
});

Parse.Cloud.define('testPlaceSong', function(request, response) {
  let ids = ['932648449', '932648779', '932648796', '907242707', '907242710', '907242703'];
  let params = randomLocation();
  params.serviceId = ids[Math.floor(Math.random() * ids.length)];

  Parse.Cloud.run('placeSong', params).then(response.success, response.error);
});