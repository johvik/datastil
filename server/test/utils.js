process.env.NODE_ENV = 'test';

var config = exports.config = require('../config_test.js');
var db = require('../lib/db')(config);
db.init(function() {});

var mysql = require('mysql');
var async = require('async');
var fs = require('fs');
var path = require('path');

exports.address = 'http://localhost:' + config.PORT;

exports.distPath = path.join(__dirname, '..', '..', 'client', 'dist');

exports.getDistFileContent = function(file) {
  return fs.readFileSync(path.join(exports.distPath, file)).toString();
};

exports.DBdrop = function(callback) {
  var connection = mysql.createConnection({
    user: config.USER,
    password: config.PASSWORD
  });
  connection.connect(function(err) {
    if (err) {
      throw err;
    }
    connection.query('DROP DATABASE IF EXISTS ' + config.DB, function(err) {
      if (err) {
        throw err;
      }
      connection.end(callback);
    });
  });
};

exports.DBclear = function(callback) {
  // truncate all tables
  var connection = mysql.createConnection({
    user: config.USER,
    password: config.PASSWORD
  });
  connection.connect(function(err) {
    if (err) {
      throw err;
    }
    connection.query('SHOW TABLES IN ' + config.DB, function(err, res) {
      async.eachSeries(res, function(item, cb) {
          var name = config.DB + '.' + item[Object.keys(item)[0]];
          connection.query('TRUNCATE TABLE ' + name, cb);
        },
        function() {
          connection.end(callback);
        });
    });
  });
};

exports.testData = function(time) {
  return {
    groups: [{
      id: 123,
      name: 'abc'
    }],
    classes: [{
      id: 123,
      groupid: 123,
      day: 0,
      time: '10:00',
      startTime: time,
      lediga: 10,
      bokningsbara: 10,
      totalt: 10,
      aktivitet: 'abc',
      lokal: 'ABC',
      resurs: 'def',
      score: 0,
      installt: 0,
      ny: 1
    }],
    class_data: [{
      classid: 123,
      time: time,
      lediga: 10,
      bokningsbara: 10,
      waitinglistsize: 0,
      totalt: 10
    }],
    scores: [{
      day: 0,
      time: '10:00',
      classid: 123,
      startTime: time,
      aktivitet: 'abc',
      groupid: 123,
      score: 0,
      lediga: 10,
      bokningsbara: 10,
      totalt: 10,
      lokal: 'ABC',
      resurs: 'def'
    }]
  };
};

function saveTestData(dbFunc, items, callback) {
  async.eachSeries(items, function(item, cb) {
    dbFunc(item, cb);
  }, callback);
}

exports.DBtestData = function(data, callback) {
  db.init(function() {
    saveTestData(db.saveGroup, data.groups, function() {
      saveTestData(db.saveClass, data.classes, function() {
        saveTestData(db.insertClassData, data.class_data, function() {
          saveTestData(db.saveScore, data.scores, callback);
        });
      });
    });
  });
};
