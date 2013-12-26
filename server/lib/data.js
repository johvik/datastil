var request = require('superagent');
var async = require('async');
var db = require('./db');

var done = true;

exports.update = function() {
  if (!done) {
    console.log('Update already running... ' + new Date());
    return; // Let old update finish
  } else {
    console.log('Starting update ' + new Date());
  }
  done = false;
  var page = 0;
  async.whilst(
    function() {
      return !done;
    },
    function(callback) {
      request.get('http://www.mittlivsstil.se/api/classes/' + page + '/').end(function(err, res) {
        if (err) {
          return callback(err);
        }
        var classes = res.body.classes;
        if (!classes) {
          return callback('Classes not found');
        }
        async.eachSeries(classes, db.saveData, function(err) {
          if (classes.length < 20) { // 20 classes/page
            done = true;
          }
          page++;
          callback(err);
        });
      });
    },
    function(err) {
      // Always set true just to be sure
      done = true;
      console.log('Done ' + new Date(), err, page);
    }
  );
};
