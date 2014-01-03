var request = require('superagent');
var async = require('async');
var db = require('./db');

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
    // Do not store data if it is more than 10 days left
    if ((startTime - currentTime) > 86400000 * 10) {
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
exports.fetchData = function() {
  if (!done) {
    runningCount++;
    console.log('Update already running... ' + runningCount + ' ' + new Date());
    if (runningCount >= 5) {
      // To avoid deadlock...
      done = true;
    }
    return; // Let old update finish
  } else {
    runningCount = 0;
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
      console.log('Done ' + new Date(), err, page);
    }
  );
};
