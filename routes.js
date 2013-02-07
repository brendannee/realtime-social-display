var async = require('async')
  , _ = require('underscore')
  , moment = require('moment')
  , request = require('request');


module.exports = function routes(app){

  app.get('/api/foursquare.json', function(req, res){
    request.get({
        url: 'https://api.foursquare.com/v2/checkins/recent'
      , qs: {
            oauth_token: app.set('foursquareToken')
          , v: '20130125'
          , ll: '37.77415,-122.43635'
        }
      , json: true
    }, function(e, response, body) {
      res.json(body);
    });
  });

  app.get('/api/instagram.json', function(req, res){
    var users = [3277, 3625059, 7968995, 23699909, 1969470, 4335886, 14683913, 403770, 8625420, 728636, 178231050, 263428, 201765534, 194565073, 199575452, 615058, 184294671, 32411825, 36704790, 39558678, 5311719, 30921174, 30926690],
        pictures = [];
    async.forEach(users, function(user, cb){
      request.get({
          url: 'https://api.instagram.com/v1/users/' + user + '/media/recent/'
        , qs: {
              access_token: app.set('instagramToken')
          }
        , json: true
      }, function(e, response, body) {
        pictures = _.union(pictures, body.data);
        cb();
      });
    }, function(e) {
      res.json(_.sortBy(pictures, function(picture){ return -1 * picture.created_time; }));
    });

  });

  //Nothing specified
  app.all('*', function notFound(req, res) {
    res.send('Not Found');
  });

}

