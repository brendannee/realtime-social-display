const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const nconf = require('nconf');

nconf.env().argv();
nconf.file('./config.json');

const routes = require('./routes');

const app = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/twitter', routes.getTweets);
app.get('/api/foursquare', routes.getFoursquare);
app.get('/api/instagram', routes.getInstagram);

// error handling
require('./libs/errors')(app);

module.exports = app;
