process.env.NODE_ENV = 'test';

var config = require('../config_test.js');

var mysql = require('mysql');
var async = require('async');
var fs = require('fs');
var path = require('path');

exports.address = 'http://localhost:' + config.PORT;

exports.distPath = path.join(__dirname, '..', '..', 'client', 'dist');

exports.getDistFileContent = function(file) {
  return fs.readFileSync(path.join(exports.distPath, file)).toString();
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

exports.DBtestData = function(time, callback) {
  var db = require('../lib/db')(config);
  db.init(function() {
    db.saveGroup({
      id: 123,
      name: 'abc'
    }, function() {
      db.saveClass({
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
        ny: 1
      }, function() {
        db.insertClassData({
          classid: 123,
          time: time,
          lediga: 10,
          bokningsbara: 10,
          waitinglistsize: 0,
          totalt: 10
        }, function() {
          db.saveScore({
            day: 0,
            time: '10:00',
            startTime: time,
            aktivitet: 'abc',
            groupid: 123,
            score: 0,
            lediga: 10,
            bokningsbara: 10,
            totalt: 10,
            lokal: 'ABC',
            resurs: 'def'
          }, callback);
        });
      });
    });
  });
};
