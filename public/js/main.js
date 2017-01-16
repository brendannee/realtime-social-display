var since_id = 0;
var isPi = (navigator.userAgent.indexOf("armv6") != -1 || navigator.userAgent.indexOf("Midori") != -1);


var linkify = (function () {
  var replaceSubstr = function (text, i, j, substr) {
    return text.substr(0, i) + substr + text.substr(j);
  }

  var mergeByIndices = function (a, b) {
    var i = 0,
      j = 0,
      result = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && (j >= b.length || a[i].indices[0] < b[j].indices[0]))
        result.push(a[i++]);
      else
        result.push(b[j++]);
    }
    return result;
  }

  var linkEntity = function (entity) {
    if (entity.name) // user mention
      return "<a href=\"http://twitter.com/" + entity.screen_name + "\" class=\"user-mention\">@" + entity.screen_name + "</a>";
    else if (entity.url) // url
      return "<a href=\"" + entity.url + "\" class=\"url\">" + entity.display_url + "</a>";
    else // hashtag
      return "<a href=\"http://twitter.com/search/%23" + entity.text + "\" class=\"hashtag\">#" + entity.text + "</a>";
  }

  var linkify = function (post) {
    var text = post.text,
      offset = 0;
    var entities = mergeByIndices(mergeByIndices(post.entities.hashtags, post.entities.urls), post.entities.user_mentions);
    entities.forEach(function (entity) {
      var new_substr = linkEntity(entity);
      text = replaceSubstr(text, entity.indices[0] + offset, entity.indices[1] + offset, new_substr);
      offset += new_substr.length - (entity.indices[1] - entity.indices[0]);
    });
    return text;
  }
  return linkify;
})();

function updateTwitter() {
  try {
    $.getJSON('/api/twitter', {
      since_id: since_id
    }, function (data) {
      data.forEach(function (tweet) {
        //Update 'since_id' if larger
        since_id = (tweet.id > since_id) ? tweet.id : since_id;

        //ignore @replies and blank tweets
        if (tweet.text == undefined || (tweet.in_reply_to_user_id && tweet.in_reply_to_screen_name != 'pwndepot') || (tweet.text[0] == '@' && tweet.text.substring(0, 9) != '@pwndepot')) {
          return;
        }
        // Build the html string for the current tweet
        var statusUrl = 'http://www.twitter.com/' + tweet.from_user + '/status/' + tweet.id;
        $('<div>')
          .addClass('tweet')
          .attr('id', tweet.id)
          .append($('<div>')
            .addClass('userInfo')
            .append($('<img>')
              .attr('src', tweet.user.profile_image_url.replace('_normal', '_bigger'))
              .addClass('userImage'))
            .append($('<div>')
              .addClass('userName')
              .text(tweet.user.name))
            .append($('<div>')
              .addClass('caption')
              .html(linkify(tweet)))
            .append($('<cite>')
              .addClass('timeago')
              .attr('title', tweet.created_at)))
          .appendTo('#twitter .scroll-wrap')

        if (tweet.entities.media) {
          //grab first image
          var height = $('#twitter').width() / tweet.entities.media[0].sizes.medium.w * tweet.entities.media[0].sizes.medium.h;
          $('#' + tweet.id)
            .css('background-image', 'url(' + tweet.entities.media[0].media_url + ')')
            .height(height)
            .addClass('background');
        } else if (tweet.entities.urls && tweet.entities.urls.length) {
          //use embed.ly to get image from first URL
          var embedlyOptions = {
            key: '991322aef9ba4e68b66546387e0b216d',
            url: tweet.entities.urls[0].expanded_url,
            maxwidth: 600
          }
          $.getJSON('http://api.embed.ly/1/oembed?callback=?', embedlyOptions, function (data) {
            if (data.thumbnail_url) {
              var height = $('#twitter').width() / data.thumbnail_width * data.thumbnail_height;
              $('#' + tweet.id)
                .css('background-image', 'url(' + data.thumbnail_url + ')')
                .height(height)
                .addClass('background');
            }
          });
        }
      });
      $('#twitter .timeago').timeago();
    });
  } catch (e) {
    console.log(e);
  }
}


function scrollTwitter() {
  var first = $('#twitter .tweet:first-child');
  if (isPi) {
    $('#twitter .scroll-wrap').append(first);
  } else {
    $('#twitter .scroll-wrap').animate({
      top: -$(first).height()
    }, 800, function () {
      $('#twitter .scroll-wrap')
        .append(first)
        .css('top', 0);
    });
  }
}

function updatePlaces() {
  try {
    var currentTime = new Date(),
      currentMinutes = currentTime.getMinutes(),
      currentHours = currentTime.getHours(),
      currentDay = currentTime.getDay();

    if (currentHours < 4) {
      currentHours += 24;
      currentDay -= 1;
    }
    $.getJSON('/data/venues.json', function(venues) {
      venues.forEach(function (place) {
        var divName = place.name.replace(/[!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~\s]/g, ''),
          div = $('#' + divName),
          hours = place.hours.all || place.hours[currentDay],
          status;

        if (!div.length) {
          var div = $('<div>')
            .addClass('place')
            .attr('id', divName)
            .append($('<div>')
              .addClass('status'))
            .append($('<a>')
              .addClass('storeName')
              .attr('href', place.url)
              .html(place.name))
            .append($('<span>')
              .addClass('countdown'))
            .appendTo('#nearby');
        }
        if (hours[1] - hours[0] == 24) {
          status = 'open';
        } else if (currentHours < hours[0] || currentHours >= hours[1]) {
          status = 'closed';
        } else if (currentHours == (hours[1] - 1)) {
          status = 'closing';
        } else {
          status = 'open';
        }
        $(div).attr('data-status', status);
        $('.countdown', div).html(((currentMinutes - 60) * -1) + " min");
      });

      $('#nearby [data-status="open"]').each(function (idx, item) {
        $('#nearby').append(item);
      });
      $('#nearby [data-status="closing"]').each(function (idx, item) {
        $('#nearby').append(item);
      });
      $('#nearby [data-status="closed"]').each(function (idx, item) {
        $('#nearby').append(item);
      });
    });
  } catch (e) {
    console.log(e);
  }
}

function updateFoursquare() {
  try {
    $.getJSON('/api/foursquare', function (data) {
      var width = $(window).width() / 3;
      if (data) {
        data.forEach(function (checkin) {
          var createdAt = new Date(checkin.createdAt * 1000);
          //only show checkins newer than one day
          if (new Date().getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000) {
            var div = $('#foursquare_' + checkin.user.id);
            if (!div.length) {
              div = $('<a>')
                .attr('id', 'foursquare_' + checkin.user.id)
                .addClass('foursquare')
                .width(width)
                .appendTo('#foursquare .scroll-wrap');
            }

            div
              .empty()
              .attr('href', checkin.venue.canonicalUrl)
              .append($('<img>')
                .attr('src', checkin.user.photo.prefix + '100x100' + checkin.user.photo.suffix))
              .append($('<div>')
                .addClass('userName')
                .text(checkin.user.firstName))
              .append($('<h2>')
                .html(checkin.venue.name))
              .append($('<div>')
                .addClass('shout')
                .html(checkin.shout))
              .append($('<cite>')
                .attr('title', createdAt.toISOString()));

            //size title
            var ratio = 26 / $('h2', div).text().length;
            if (ratio <= 1) {
              $('h2', div).css('font-size', Math.round(ratio * 10000) / 100 + '%');
            }
          }
        });
        $('#foursquare cite').timeago();
      }
    });
  } catch (e) {
    console.log(e);
  }
}


function scrollFoursquare() {
  var first = $('#foursquare .scroll-wrap a:first-child');
  if (isPi) {
    $('#foursquare .scroll-wrap').append(first);
  } else {
    $('#foursquare .scroll-wrap').animate({
      left: -$(first).width()
    }, 800, function () {
      $('#foursquare .scroll-wrap')
        .append(first)
        .css('left', 0)
    });
  }
}


function updateInstagram() {
  try {
    $.getJSON('/api/instagram', function (data) {
      if (data.length) {
        $('#instagram .instagram').remove();
        data.forEach(function (picture) {
          if (!picture) {
            return
          }
          var createdAt = new Date(picture.created_time * 1000);
          if (new Date().getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000) {
            $('<div>')
              .addClass('instagram')
              .append($('<img>')
                .addClass('instagramImage')
                .attr('src', picture.images.standard_resolution.url))
              .append($('<div>')
                .addClass('userInfo')
                .append($('<img>')
                  .attr('src', picture.user.profile_picture)
                  .addClass('userImage'))
                .append($('<div>')
                  .text(picture.user.full_name)
                  .addClass('userName'))
                .append($('<div>')
                  .addClass('caption')
                  .html((picture.caption) ? picture.caption.text : ''))
                .append($('<cite>')
                  .addClass('timeago')
                  .attr('title', createdAt.toISOString())))
              .appendTo('#instagram .scroll-wrap');
          }
        });
        $('#instagram .timeago').timeago()
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function scrollInstagram() {
  var first = $('#instagram .scroll-wrap .instagram:first-child');
  if (isPi) {
    $('#instagram .scroll-wrap').append(first);
  } else {
    $('#instagram .scroll-wrap').animate({
      top: -$(first).height()
    }, 800, function () {
      $('#instagram .scroll-wrap')
        .append(first)
        .css('top', 0);
    });
  }
}


$(function () {

  //check open times every minute
  updatePlaces();
  setInterval(updatePlaces, 60000);

  //update Twitterevery 5 minutes
  updateTwitter();
  setInterval(updateTwitter, 300000);

  //update Foursquare every 5 minutes
  updateFoursquare();
  setInterval(updateFoursquare, 300000);

  //update Instagram every 90 minutes
  updateInstagram();
  setInterval(updateInstagram, 5400000);

  //scroll every 5 seconds
  setInterval(function () {
    scrollInstagram();
    scrollFoursquare();
    scrollTwitter()
  }, 5000);

  //reload browser every 6 hours
  setInterval(function () {
    window.location.reload(true);
  }, 21600000);

});
