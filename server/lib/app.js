var cronJob = require('cron').CronJob;
var express = require('express');
var path = require('path');
var app = express();
var data = require('./data');
var db = require('./db');

// Run every 5 min
var job1 = new cronJob('*/5 * * * *', data.fetchData);

// Run every night at 3:33
var job2 = new cronJob('33 3 * * *', db.updateScores);

// Run every hour
var job3 = new cronJob('2 * * * *', function() {
  if (new Date().getHours() === 2) {
    db.mergeData(-1); // Full scan at 2:02
  } else {
    db.mergeData(4200000); // Include 10 min old data
  }
});

var dist = path.join(__dirname, '..', '..', 'client', 'dist');
var maxAge = 30 * 24 * 60 * 60 * 1000; // in ms

// Set up middleware
app.use(express.compress());
app.use(express.favicon(path.join(dist, 'favicon.ico'), {
  maxAge: maxAge
}));
app.use('/static', express.static(dist, {
  maxAge: maxAge
}));
app.use('/static', function(req, res, next) {
  res.send(404); // If we get here then the request for a static file is invalid
});
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.logger('short'));
app.use(app.router);

// Set up routes
app.get('/groups', function(req, res) {
  db.getGroups(function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.setHeader('Cache-Control', 'no-cache');
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
    res.setHeader('Cache-Control', 'no-cache');
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
    } else if (result.length === 0) {
      return res.send(404);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.json(result);
  });
});
app.get('/class/:id/info', function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.send(400);
  }
  db.getClassInfo(id, function(err, result) {
    if (err) {
      return res.send(500);
    } else if (!result) {
      return res.send(404);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.json(result);
  });
});
app.get('/scores', function(req, res) {
  db.getScores(function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.json(result);
  });
});
app.all('/*', function(req, res) {
  // Just send the index.html for other files to support HTML5Mode
  res.sendfile('index.html', {
    maxAge: maxAge,
    root: dist
  });
});

// Let DB init first
db.init(function() {
  // Start the server
  app.listen(9001, function() {
    console.log('Server started ' + new Date());
  });

  // Start cron jobs
  job1.start();
  job2.start();
  job3.start();
});
