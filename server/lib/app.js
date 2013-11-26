var request = require('superagent');
var async = require('async');
var cronJob = require('cron').CronJob;
var db = require('./db');

// Run every 5 min
var job = new cronJob('*/5 * * * *', function() {
  update();
});

var done = true;

function update() {
  if (!done) {
    console.log('Update already running...');
    return; // Let old update finish
  }
  done = false;
  var page = 0;
  async.whilst(
    function() {
      return !done;
    },
    function(callback) {
      request.get('http://www.mittlivsstil.se/api/classes/' + page + '/').end(function(res) {
        if (res.error) {
          return callback(res.error);
        }
        var classes = res.body.classes;
        if (!classes) {
          return callback('Classes not found');
        }
        var length = classes.length;
        for (var i = 0; i < length; i++) {
          db.saveData(classes[i]);
        }
        if (length < 20) { // 20 classes/page
          done = true;
        }
        page++;
        callback(null);
      });
    },
    function(err) {
      console.log('Done ' + new Date(), err);
    }
  );
}

// TODO Create server
job.start();
