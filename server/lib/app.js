var request = require('superagent');
var async = require('async');

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
          saveData(classes[i]);
        }
        if (length < 20) { // 20 classes/page
          done = true;
        }
        page++;
        callback(null);
      });
    },
    function(err) {
      console.log('error', err);
    }
  );
}

function saveData(data) {
  if ('id' in data && 'groupid' in data && 'startTime' in data && 'endTime' in data && 'aktivitet' in data && 'lokal' in data && 'resurs' in data && 'bokningsbara' in data && 'waitinglistsize' in data && 'totalt' in data) {
    console.log(data.id, data.groupid, parseInt(data.startTime, 10), parseInt(data.endTime, 10), data.aktivitet, data.lokal, data.resurs, parseInt(data.bokningsbara, 10), parseInt(data.waitinglistsize, 10), parseInt(data.totalt, 10));
    // TODO Handle data
    if (data.groupid == 53) {
      //console.log(data);
    }
  } else {
    console.log('Fields are missing...');
  }
}

update();
