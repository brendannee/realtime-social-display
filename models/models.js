var mongoose = require('mongoose');

var Sms = mongoose.model('sms', new mongoose.Schema({
      date               :  { type: String, index: true }
    , src                :  { type: String }
    , dst                :  { type: String }
    , msg                :  { type: String }
    , direction          :  { type: String }
    , timestamp          :  { type: String }
    , responseCode       :  { type: String }
    , error              :  { type: Boolean, default: false }
  }, {strict: true}));

var Question = new mongoose.Schema({
      number             :  { type: String }
    , answer             :  { type: String }
  }, {strict: true});

var Survey = mongoose.model('survey', new mongoose.Schema({
      src                :  { type: String, unique: true, trim: true }
    , neighborhood       :  { type: String, trim: true, index: true }
    , answers            :  [Question]
  }, {strict: true}));

var User = mongoose.model('user', new mongoose.Schema({
      username           :  { type: String, required: true, unique: true, trim: true }
    , password           :  { type: String, required: true }
  }, {strict: true}));
