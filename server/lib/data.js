var request = require('superagent');
var async = require('async');

var TEST_ENV = process.env.NODE_ENV === 'test';
var log = TEST_ENV ? function() {} : console.log;

var dataMaxAge = 86400000 * 10; // 10 days in ms

module.exports = function(db) {
  function saveData(data, callback) {
    var id = parseInt(data.id, 10);
    var groupid = parseInt(data.groupid, 10);
    var startTime = parseInt(data.startTime, 10);
    var lediga = parseInt(data.lediga, 10);
    var bokningsbara = parseInt(data.bokningsbara, 10);
    var waitinglistsize = parseInt(data.waitinglistsize, 10);
    var totalt = parseInt(data.totalt, 10);
    if (!isNaN(id) &&
      'group' in data && !isNaN(groupid) &&
      'startTimeDT' in data && !isNaN(startTime) &&
      'aktivitet' in data &&
      'lokal' in data &&
      'resurs' in data && !isNaN(lediga) && !isNaN(bokningsbara) && !isNaN(waitinglistsize) && !isNaN(totalt)) {
      var currentTime = new Date().getTime();
      // Make sure it hasn't occured yet
      if (startTime < currentTime) {
        return callback(null);
      }
      // Do not store data if it is more than maxAge
      if ((startTime - currentTime) > dataMaxAge) {
        return callback(null);
      }
      var date = new Date(startTime);
      var day = date.getDay();
      // var time = date.getHours() + ':' + date.getMinutes();
      // startTimeDT has format 2013-11-30T10:00:00
      var index = data.startTimeDT.indexOf('T');
      var time = data.startTimeDT.substring(index + 1, index + 6);
      var aktivitet = data.aktivitet.substring(0, 50); // Max 50 chars
      // Get score of the class
      db.getScore(day, time, aktivitet, function(err, score, ny) {
        if (err) {
          return callback(err);
        }
        // Update groups
        db.saveGroup({
          id: groupid,
          name: data.group
        }, function(err) {
          if (err) {
            return callback(err);
          }
          // Update classes
          db.saveClass({
            id: id,
            groupid: groupid,
            day: day,
            time: time,
            startTime: startTime,
            lediga: lediga,
            bokningsbara: bokningsbara,
            totalt: totalt,
            aktivitet: aktivitet,
            lokal: data.lokal,
            resurs: data.resurs,
            score: score,
            ny: ny
          }, function(err) {
            if (err) {
              return callback(err);
            }
            // Add data
            db.insertClassData({
              classid: id,
              time: currentTime,
              lediga: lediga,
              bokningsbara: bokningsbara,
              waitinglistsize: waitinglistsize,
              totalt: totalt
            }, callback);
          });
        });
      });
    } else {
      callback('Fields are missing...');
    }
  }

  var done = true;
  var runningCount = 0;
  // Exported functions
  return {
    fetchData: function(cb) {
      // cb(err)
      if (!done) {
        runningCount++;
        if (runningCount >= 5) {
          // To avoid deadlock...
          done = true;
        }
        // Let old update finish
        return cb('Update already running ' + runningCount);
      } else {
        runningCount = 0;
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
            async.eachSeries(classes, saveData, function(err) {
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
          return cb(err);
        }
      );
    },
    updateScores: function() {
      db.getClassesForUpdate(function(err, result) {
        if (err) {
          log('UpdateScores1', err);
          return;
        }
        async.eachSeries(result, function(item, callback) {
          db.getClassData(item.id, function(err, result) {
            if (err) {
              return callback(err);
            }
            var start = item.startTime - dataMaxAge;
            var end = item.startTime;
            while (result.length > 0 && result[0].time < start) {
              // Remove elemets before start
              result.shift();
            }
            while (result.length > 0 && result[result.length - 1].time > end) {
              // Remove elemets after end
              result.pop();
            }

            var length = result.length;
            if (length >= 2) {
              // Adjust the time at the edges
              result[0].time = start;
              result[length - 1].time = end;

              // Make them count as 50% more when its a waiting list
              var waitWeight = 1.5;
              var prev = result[0];
              var score = prev.lediga - prev.waitinglistsize * waitWeight;
              for (var i = 1; i < length; i++) {
                var curr = result[i];
                var dt = (curr.time - prev.time) / 60000; // minutes
                var val = curr.lediga - curr.waitinglistsize * waitWeight;
                score += val * dt;
                prev = curr;
              }

              var totalArea = (dataMaxAge / 60000) * prev.totalt;
              if (totalArea !== 0) {
                // Percentage of area filled
                score = 100 * score / totalArea;
                score = Math.round(score);
                score = Math.max(0, score); // >= 0
                score = Math.min(100, score); // <= 100
                // Invert to percentage not filled
                // eg make high scores best
                score = 100 - score;
              } else {
                score = 0;
              }
              // Update score
              db.saveScore({
                day: item.day,
                time: item.time,
                classid: item.id,
                startTime: item.startTime,
                aktivitet: item.aktivitet,
                groupid: item.groupid,
                score: score,
                lediga: prev.lediga,
                bokningsbara: (prev.bokningsbara - prev.waitinglistsize),
                totalt: prev.totalt,
                lokal: item.lokal,
                resurs: item.resurs
              }, function(err) {
                if (err) {
                  return callback(err);
                }
                // Delete class
                db.deleteClass(item.id, false, callback);
              });
            } else {
              // Delete class and data
              return db.deleteClass(item.id, true, callback);
            }
          });
        }, function(err) {
          log('UpdateScores2 ' + new Date(), err);
        });
      });
    }
  };
};
