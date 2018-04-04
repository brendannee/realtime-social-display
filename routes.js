const async = require('async');
const _ = require('underscore');
const request = require('request');
const nconf = require('nconf');

exports.getTweets = function(req, res) {
  if (!nconf.get('TWITTER_TOKEN')) {
    console.error('No Twitter Token defined.');
    return res.json({});
  }

  const usernames = nconf.get('TWITTER_USERS').split(',').map((username) => `from:${username}`);

  let userCount = 0;
  const userIncrement = 20;
  let tweets = [];

  async.whilst(() => userCount <= usernames.length,
    (cb) => {
      request.get({
        url: 'https://api.twitter.com/1.1/search/tweets.json',
        qs: {
          count: 100,
          include_entities: true,
          result_type: 'recent',
          since_id: req.query.since_id || 0,
          q: usernames.slice(userCount, (userCount + userIncrement)).join(' OR ')
        },
        headers: {
          Authorization: `Bearer ${nconf.get('TWITTER_TOKEN')}`
        },
        json: true
      }, (e, response, body) => {
        try {
          tweets = tweets.concat(body.statuses);
        } catch (e) {}
        cb();
      });
      userCount += userIncrement;
    }, (e, result) => {
      res.json(tweets);
    }
  );
};

exports.getFoursquare = function(req, res) {
  if (!nconf.get('FOURSQUARE_TOKEN')) {
    console.error('No Foursquare Token defined.');
    return res.json({});
  }

  request.get({
    url: 'https://api.foursquare.com/v2/checkins/recent',
    qs: {
      oauth_token: nconf.get('FOURSQUARE_TOKEN'),
      v: '20130125',
      ll: nconf.get('FOURSQUARE_COORDINATES')
    },
    json: true
  }, (e, response, body) => {
    if (!body || !body.response || !body.response.recent) {
      return res.json({});
    }

    const users = nconf.get('FOURSQUARE_USERS').split(',');

    const checkins = _.filter(body.response.recent, (checkin) => {
      return _.contains(users, checkin.user.id);
    });

    res.json(checkins);
  });
};

exports.getInstagram = function(req, res, next) {
  const users = nconf.get('INSTAGRAM_USERS').split(',');

  const pictures = [];

  async.forEach(users, (user, cb) => {
    request.get(`https://www.instagram.com/${user}/?__a=1`, (err, response, body) => {
      if (err) {
        // don't returh errors for individual users
        console.error(err);
        return cb();
      } else if(response.statusCode != 200) {
        // don't returh errors for individual users
        console.error(response.statusCode);
        return cb();
      }

      try {
        var json = JSON.parse(body);

        json.graphql.user.edge_owner_to_timeline_media.edges.forEach(edge => {
          edge.node.owner = {
            full_name: json.graphql.user.full_name,
            profile_pic_url: json.graphql.user.profile_pic_url
          }
        });

        pictures.push(...json.graphql.user.edge_owner_to_timeline_media.edges);
        cb();
      } catch(err){
        cb(err);
      }
    });
  }, (err) => {
    if (err) {
      return next(err);
    }

    res.json(_.sortBy(pictures, picture => {
      return -1 * picture.node.taken_at_timestamp;
    }));
  });
};
