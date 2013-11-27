var request = require('superagent');
var async = require('async');
var cronJob = require('cron').CronJob;
var express = require('express');
var app = express();
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
      console.log('Done ' + new Date(), err, page);
    }
  );
}

// Set up middleware
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.logger('dev'));
app.use(app.router);

// TODO Set up API
app.get('/', function(req, res) {
  res.send('test');
});

app.listen(9001);

job.start();
