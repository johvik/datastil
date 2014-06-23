var cronJob = require('cron').CronJob;
var express = require('express');
var path = require('path');
var app = express();
var TEST_ENV = process.env.NODE_ENV === 'test';
var log = TEST_ENV ? function() {} : console.log;
var config = TEST_ENV ?
  require('../config_test') : require('../config');

var db = require('./db')(config);
var data = require('./data')(db);

// Check config file
if (!('PORT' in config)) {
  throw 'Missing parameters in config file';
}

// Run every 5 min
var job1 = new cronJob('*/5 * * * *', function() {
  data.fetchData(function(err) {
    if (err) {
      log('FetchData ' + new Date(), err);
    } else {
      data.updateScores(function(err) {
        if (err) {
          log('UpdateScores ' + new Date(), err);
        }
      });
    }
  });
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
if (!TEST_ENV) {
  app.use(express.logger('short'));
}
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
  var pageSize = 20;
  if ('size' in req.query) {
    var n = parseInt(req.query.size, 10);
    if (isNaN(n) || n <= 0 || n >= 2147483647) {
      // Not a number or out of range
      return res.send(400);
    }
    pageSize = n;
  }
  db.getClasses(id, filter, pageSize, function(err, result) {
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

app.get('/scores/:id', function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 0) {
    return res.send(400);
  }
  var pageSize = 20;
  if ('size' in req.query) {
    var n = parseInt(req.query.size, 10);
    if (isNaN(n) || n <= 0 || n >= 2147483647) {
      // Not a number or out of range
      return res.send(400);
    }
    pageSize = n;
  }
  db.getScores(id, pageSize, function(err, result) {
    if (err) {
      return res.send(500);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.json(result);
  });
});

app.get('/score/:id', function(req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.send(400);
  }
  db.getScoreInfo(id, function(err, result) {
    if (err) {
      return res.send(500);
    } else if (!result) {
      return res.send(404);
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
  app.listen(config.PORT, function() {
    log('Server started ' + new Date());
  });
  if (!TEST_ENV) {
    // Start cron jobs
    job1.start();
  }
});
