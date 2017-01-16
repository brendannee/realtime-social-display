const async = require('async');
const _ = require('underscore');
const request = require('request');
const nconf = require('nconf');
const scraper = require('insta-scraper');


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

exports.getInstagram = function(req, res) {
  if (!nconf.get('INSTAGRAM_TOKEN')) {
    console.error('No Instagram Token defined.');
    return res.json({});
  }

  const users = nconf.get('INSTAGRAM_USERS').split(',');

  let pictures = [];

  async.forEach(users, (user, cb) => {
    scraper.getAccountMedia(user, (err, response) => {
      if (err) {
        cb(err);
      }

      pictures = _.union(pictures, response);
      cb();
    });
  }, (err) => {
    if (err) {
      console.err(error);
    }

    res.json(_.sortBy(pictures, (picture) => {
      return -1 * picture.created_time;
    }));
  });
};
