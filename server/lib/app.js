var request = require('superagent');
var async = require('async');
var cronJob = require('cron').CronJob;
var express = require('express');
var app = express();
var db = require('./db');

// Run every 5 min
var job1 = new cronJob('*/5 * * * *', function() {
  update();
});

// Run every night at 3:33
var job2 = new cronJob('33 3 * * *', function() {
  db.updateScores();
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
      if (err) {
        done = true;
      }
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

// Set up routes
app.get('/groups', function(req, res) {
  db.getGroups(function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.json(result);
  });
});
app.get('/classes/:id', function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 0) {
    return res.send(400);
  }
  var filter = [];
  if ('filter' in req.query) {
    // This forces the filter parameter to contain data
    // 400 will be sent otherwise
    var split = req.query.filter.split(',');
    for (var i = 0, j = split.length; i < j; i++) {
      var num = parseInt(split[i], 10);
      if (isNaN(num)) {
        return res.send(400);
      }
      filter.push(num);
    }
  }
  db.getClasses(id, filter, function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.json(result);
  });
});
app.get('/class/:id', function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.send(400);
  }
  db.getClassData(id, function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.json(result);
  });
});

// Start the server
app.listen(9001, function() {
  console.log('Server started ' + new Date());
});

// Start cron jobs
job1.start();
job2.start();
