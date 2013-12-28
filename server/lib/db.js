var config = require('../config');
var mysql = require('mysql');
var async = require('async');

var pool = mysql.createPool({
  user: config.USER,
  password: config.PASSWORD
});

function initDB() {
  pool.getConnection(function(err, connection) {
    if (err) {
      throw err;
    }
    connection.query('CREATE DATABASE IF NOT EXISTS datastil', function(err) {
      if (err) {
        throw err;
      }
      connection.query('CREATE TABLE IF NOT EXISTS datastil.groups(' +
        'id INT NOT NULL PRIMARY KEY,' +
        'name TEXT NOT NULL)', function(err) {
          if (err) {
            throw err;
          }
          connection.query('CREATE TABLE IF NOT EXISTS datastil.classes(' +
            'id INT NOT NULL PRIMARY KEY,' +
            'day INT NOT NULL,' +
            'time CHAR(5) NOT NULL,' +
            'groupid INT NOT NULL,' +
            'startTime BIGINT NOT NULL,' +
            // This is actually bokningsbara - waitinglistsize
            'bokningsbara INT NOT NULL,' +
            'aktivitet VARCHAR(50) NOT NULL,' +
            'lokal TEXT NOT NULL,' +
            'resurs TEXT NOT NULL,' +
            'score INT NOT NULL,' +
            'ny BOOL NOT NULL)', function(err) {
              if (err) {
                throw err;
              }
              connection.query('CREATE TABLE IF NOT EXISTS datastil.class_data(' +
                'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
                'classid INT NOT NULL,' +
                'time BIGINT NOT NULL,' +
                'bokningsbara INT NOT NULL,' +
                'waitinglistsize INT NOT NULL,' +
                'totalt INT NOT NULL,' +
                'INDEX(classid))', function(err) {
                  if (err) {
                    throw err;
                  }
                  // TODO Can this table be merged together with classes?
                  connection.query('CREATE TABLE IF NOT EXISTS datastil.scores(' +
                    'day INT NOT NULL,' +
                    'time CHAR(5) NOT NULL,' +
                    'aktivitet VARCHAR(50) NOT NULL,' +
                    'score INT NOT NULL,' +
                    'bokningsbara INT NOT NULL,' +
                    'PRIMARY KEY (day, time, aktivitet))', function(err) {
                      if (err) {
                        throw err;
                      }
                      // Nothing went wrong release connection
                      connection.release();
                    });
                });
            });
        });
    });
  });
}
initDB();

exports.saveData = function(data, callback) {
  var id = parseInt(data.id, 10);
  var groupid = parseInt(data.groupid, 10);
  var startTime = parseInt(data.startTime, 10);
  var bokningsbara = parseInt(data.bokningsbara, 10);
  var waitinglistsize = parseInt(data.waitinglistsize, 10);
  var totalt = parseInt(data.totalt, 10);
  if (!isNaN(id) && 'group' in data && !isNaN(groupid) && 'startTimeDT' in data && !isNaN(startTime) && 'aktivitet' in data && 'lokal' in data && 'resurs' in data && !isNaN(bokningsbara) && !isNaN(waitinglistsize) && !isNaN(totalt)) {
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
    pool.getConnection(function(err, connection) {
      if (err) {
        // No connection
        connection.release();
        return callback(err);
      }
      // Get score of the class
      connection.query('SELECT score FROM datastil.scores WHERE day = ' + mysql.escape(day) + ' AND time = ' + mysql.escape(time) + ' AND aktivitet = ' + mysql.escape(aktivitet), function(err, result) {
        if (err) {
          console.log('Scores', err);
        }
        var score = 0;
        var ny = 1;
        if (result && result.length > 0) {
          score = result[0].score;
          ny = 0;
        }
        // Update groups
        connection.query('INSERT INTO datastil.groups SET ? ON DUPLICATE KEY UPDATE ' + mysql.escape({
          name: data.group
        }), {
          id: groupid,
          name: data.group
        }, function(err, result) {
          if (err) {
            console.log('Groups', err);
          }
          // Update classes
          connection.query('INSERT INTO datastil.classes SET ? ON DUPLICATE KEY UPDATE ' + mysql.escape({
            groupid: groupid,
            day: day,
            time: time,
            startTime: startTime,
            bokningsbara: bokningsbara - waitinglistsize,
            aktivitet: aktivitet,
            lokal: data.lokal,
            resurs: data.resurs,
            score: score,
            ny: ny
          }), {
            id: id,
            groupid: groupid,
            day: day,
            time: time,
            startTime: startTime,
            bokningsbara: bokningsbara - waitinglistsize,
            aktivitet: aktivitet,
            lokal: data.lokal,
            resurs: data.resurs,
            score: score,
            ny: ny
          }, function(err, result) {
            if (err) {
              console.log('Classes', err);
            }
            // Add data
            connection.query('INSERT INTO datastil.class_data SET ?', {
                classid: id,
                time: currentTime,
                bokningsbara: bokningsbara,
                waitinglistsize: waitinglistsize,
                totalt: totalt
              },
              function(err, result) {
                if (err) {
                  console.log('Data', err);
                }
                connection.release();
                callback(err);
              });
          });
        });
      });
    });
  } else {
    callback('Fields are missing...');
  }
};

exports.updateScores = function() {
  // Add 10 min margin
  var currentTime = new Date().getTime() - 600000;
  pool.getConnection(function(err, connection) {
    if (err) {
      // No connection
      connection.release();
      return;
    }
    connection.query('SELECT id, day, time, aktivitet FROM datastil.classes WHERE startTime < ' + mysql.escape(currentTime) + ' ORDER BY startTime ASC', function(err, result) {
      if (err) {
        console.log('UpdateScores1', err);
      }
      async.eachSeries(result, function(item, callback) {
        exports.getClassData(item.id, function(err, result) {
          if (err) {
            return callback(err);
          }
          var length = result.length;
          if (length > 0) {
            var dt;
            var last = result[length - 1];
            var prev = result[0];
            var score = prev.bokningsbara - prev.waitinglistsize;
            for (var i = 1; i < length; i++) {
              var curr = result[i];
              dt = (curr.time - prev.time) / 60000; // minutes
              score += (curr.bokningsbara - curr.waitinglistsize) * dt;
              prev = curr;
            }

            // Extend last if data is missing
            if (last.time < currentTime) {
              dt = (currentTime - last.time) / 60000; // minutes
              score += (last.bokningsbara - last.waitinglistsize) * dt;
            }

            if (last.totalt !== 0) {
              score = score / last.totalt;
            }
            score = Math.round(score);

            // Update score
            connection.query('INSERT INTO datastil.scores SET ? ON DUPLICATE KEY UPDATE ' + mysql.escape({
              score: score,
              bokningsbara: (last.bokningsbara - last.waitinglistsize)
            }), {
              day: item.day,
              time: item.time,
              aktivitet: item.aktivitet,
              score: score,
              bokningsbara: last.bokningsbara
            }, function(err, result) {
              if (err) {
                return callback(err);
              }
              // Delete data
              connection.query('DELETE FROM datastil.classes WHERE ?', {
                id: item.id
              }, function(err, result) {
                if (err) {
                  return callback(err);
                }
                connection.query('DELETE FROM datastil.class_data WHERE ?', {
                  classid: item.id
                }, callback);
              });
            });
          } else {
            // Do nothing
            callback(null);
          }
        });
      }, function(err) {
        connection.release();
        console.log('UpdateScores2', err);
      });
    });
  });
};

exports.mergeData = function() {
  pool.getConnection(function(err, connection) {
    if (err) {
      // No connection
      connection.release();
      return;
    }
    connection.query('SELECT id FROM datastil.classes', function(err, result) {
      if (err) {
        console.log('MergeData1', err);
      }
      // Now - 6h, time between checks is 5h
      var prevTime = new Date().getTime() - 21600000;
      async.eachSeries(result, function(item, callback) {
        connection.query('SELECT id, bokningsbara, waitinglistsize, totalt FROM datastil.class_data WHERE classid = ' + mysql.escape(item.id) + ' AND time >= ' + mysql.escape(prevTime) + ' ORDER BY time ASC', function(err, result) {
          if (err) {
            return callback(err);
          }
          var length = result.length;
          if (length >= 3) {
            var prev = result[0];
            var remove = []; // ids to remove

            // Skip first and last
            for (var i = 1; i < length - 1; i++) {
              var curr = result[i];
              var next = result[i + 1];
              // Compare to prev and next
              if (curr.bokningsbara === prev.bokningsbara &&
                curr.waitinglistsize === prev.waitinglistsize &&
                curr.totalt === prev.totalt &&
                curr.bokningsbara === next.bokningsbara &&
                curr.waitinglistsize === next.waitinglistsize &&
                curr.totalt === next.totalt) {
                // All three are equal, remove middle element
                remove.push(curr.id);
              }
              prev = curr;
            }
            // Remove unnecesary data
            if (remove.length > 0) {
              connection.query('DELETE FROM datastil.class_data WHERE id IN (' + mysql.escape(remove) + ')', callback);
            } else {
              callback(null);
            }
          } else {
            // Do nothing
            callback(null);
          }
        });
      }, function(err) {
        connection.release();
        console.log('MergeData2', err);
      });
    });
  });
};

exports.getGroups = function(callback) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT id, name FROM datastil.groups', function(err, result) {
      connection.release();
      callback(err, result);
    });
  });
};

exports.getClasses = function(id, filter, callback) {
  var currentTime = new Date().getTime();
  var query = 'SELECT id, day, time, groupid, startTime, bokningsbara, aktivitet, lokal, resurs, score, ny FROM datastil.classes WHERE startTime >= ' + mysql.escape(currentTime);
  if (filter.length > 0) {
    query += ' AND groupid IN (' + mysql.escape(filter) + ')';
  }
  query += ' ORDER BY startTime ASC LIMIT ' + mysql.escape(id * 20) + ',20';
  pool.getConnection(function(err, connection) {
    connection.query(query, function(err, result) {
      connection.release();
      callback(err, result);
    });
  });
};

exports.getClassData = function(id, callback) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT time, bokningsbara, waitinglistsize, totalt FROM datastil.class_data WHERE classid = ' + mysql.escape(id) + ' ORDER BY time ASC', function(err, result) {
      connection.release();
      callback(err, result);
    });
  });
};

exports.getClassInfo = function(id, callback) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT id, day, time, groupid, startTime, bokningsbara, aktivitet, lokal, resurs, score, ny FROM datastil.classes WHERE id = ' + mysql.escape(id), function(err, result) {
      connection.release();
      callback(err, result[0]);
    });
  });
};

exports.getScores = function(callback) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT day, time, aktivitet, score, bokningsbara FROM datastil.scores ORDER BY score ASC', function(err, result) {
      connection.release();
      callback(err, result);
    });
  });
};
