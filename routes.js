var async = require('async')
  , _ = require('underscore')
  , moment = require('moment')
  , request = require('request');


module.exports = function routes(app){
  app.get('/api/twitter', function(req, res){
    if(!app.set('twitterToken')) {
      console.error('No Twitter Token defined.');
      res.json({});
    }
    var usernames = [
        'from:pwndepot',
        '@pwndepot',
        'from:brendannee',
        'from:lstonehill',
        'from:_nw_',
        'from:lweite',
        'from:woeismatt',
        'from:cpetzold',
        'from:rooferford',
        'from:rauchg',
        'from:halfhenry',
        'from:stevebice',
        'from:w01fe',
        'from:qago',
        'from:blinktaginc',
        'from:keussen',
        'from:dduugg',
        'from:juliebadoolie',
        'from:mgougherty',
        'from:jkeussen',
        'from:carolinetien',
        'from:trucy',
        'from:jedsez',
        'from:gunniho',
        'from:omalleycali',
        'from:jedsez',
        'from:jeremyaaronlong',
        'from:Talyn',
        'from:cedickie',
        'from:IKusturica',
        'from:betula82',
        'from:kfarr'
      ];
    var userCount = 0,
        userIncrement = 20,
        tweets = [];
    async.whilst(function(){ return (userCount <= usernames.length); },
      function(cb){
        request.get({
            url: 'https://api.twitter.com/1.1/search/tweets.json'
          , qs: {
                count: 100
              , include_entities: true
              , result_type: 'recent'
              , since_id: req.query.since_id || 0
              , q: usernames.slice(userCount, (userCount + userIncrement)).join(' OR ')
            }
          , headers: {Authorization: 'Bearer ' + app.set('twitterToken')}
          , json: true
        }, function(e, response, body) {
          try {
            tweets = tweets.concat(body.statuses);
          } catch(e) { }
          cb();
        });
        userCount += userIncrement;
      }, function(e, result) {
        res.json(tweets);
    });
  });

  app.get('/api/foursquare', function(req, res){
    if(!app.set('foursquareToken')) {
      console.error('No Foursquare Token defined.');
      res.json({});
    }
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

  app.get('/api/instagram', function(req, res){
    if(!app.set('instagramToken')) {
      console.error('No Instagram Token defined.');
      res.json({});
    }
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
      res.json(_.sortBy(pictures, function(picture){
        if(!picture) {
          return;
        }
        return -1 * picture.created_time;
      }));
    });

  });

  //Nothing specified
  app.use(function(req, res, next){
    res.send(404, 'Sorry cant find that!');
  });
}

