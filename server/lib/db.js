var config = require('../config');
var mysql = require('mysql');
var async = require('async');

var pool = mysql.createPool({
  user: config.USER,
  password: config.PASSWORD,
  database: config.DB
});

// Wrapper to get a pool connection and release before callback
function poolQuery(query, callback) {
  // callback(err, res)
  pool.getConnection(function(err, connection) {
    if (err) {
      connection.release();
      return callback(err);
    }
    connection.query(query, function(err, res) {
      connection.release();
      return callback(err, res);
    });
  });
}

function createDB(callback) {
  if (!config.DB) {
    throw 'No DB in config.js';
  }
  var connection = mysql.createConnection({
    user: config.USER,
    password: config.PASSWORD
  });
  connection.connect(function(err) {
    if (err) {
      throw err;
    }
    connection.query('CREATE DATABASE IF NOT EXISTS ' + config.DB, function(err) {
      if (err) {
        throw err;
      }
      connection.end(callback);
    });
  });
}

function createTables(callback) {
  pool.getConnection(function(err, connection) {
    if (err) {
      throw err;
    }
    connection.query('CREATE TABLE IF NOT EXISTS groups(' +
      'id INT NOT NULL PRIMARY KEY,' +
      'name TEXT NOT NULL)', function(err) {
        if (err) {
          throw err;
        }
        connection.query('CREATE TABLE IF NOT EXISTS classes(' +
          'id INT NOT NULL PRIMARY KEY,' +
          'day INT NOT NULL,' +
          'time CHAR(5) NOT NULL,' +
          'groupid INT NOT NULL,' +
          'startTime BIGINT NOT NULL,' +
          'lediga INT NOT NULL,' +
          'bokningsbara INT NOT NULL,' +
          'totalt INT NOT NULL,' +
          'aktivitet VARCHAR(50) NOT NULL,' +
          'lokal TEXT NOT NULL,' +
          'resurs TEXT NOT NULL,' +
          'score INT NOT NULL,' +
          'ny BOOL NOT NULL)', function(err) {
            if (err) {
              throw err;
            }
            connection.query('CREATE TABLE IF NOT EXISTS class_data(' +
              'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
              'classid INT NOT NULL,' +
              'time BIGINT NOT NULL,' +
              'lediga INT NOT NULL,' +
              'bokningsbara INT NOT NULL,' +
              'waitinglistsize INT NOT NULL,' +
              'totalt INT NOT NULL,' +
              'INDEX(classid))', function(err) {
                if (err) {
                  throw err;
                }
                // TODO Can this table be merged together with classes?
                connection.query('CREATE TABLE IF NOT EXISTS scores(' +
                  'day INT NOT NULL,' +
                  'time CHAR(5) NOT NULL,' +
                  'startTime BIGINT NOT NULL,' +
                  'aktivitet VARCHAR(50) NOT NULL,' +
                  'groupid INT NOT NULL,' +
                  'score INT NOT NULL,' +
                  'lediga INT NOT NULL,' +
                  'bokningsbara INT NOT NULL,' +
                  'totalt INT NOT NULL,' +
                  'lokal TEXT NOT NULL,' +
                  'resurs TEXT NOT NULL,' +
                  'PRIMARY KEY (day, time, aktivitet))', function(err) {
                    if (err) {
                      throw err;
                    }
                    // Nothing went wrong release connection
                    connection.release();
                    callback();
                  });
              });
          });
      });
  });
}

var mustCall = setTimeout(function() {
  throw 'Must call init in DB';
}, 1000);

exports.init = function(callback) {
  clearTimeout(mustCall);
  createDB(function(err) {
    if (err) {
      throw err;
    }
    createTables(callback);
  });
};

exports.getScore = function(day, time, aktivitet, callback) {
  // callback(err, score, isnew)
  poolQuery('SELECT score FROM scores WHERE day = ' +
    pool.escape(day) + ' AND time = ' +
    pool.escape(time) + ' AND aktivitet = ' +
    pool.escape(aktivitet), function(err, res) {
      if (err) {
        return callback(err);
      }
      if (res && res.length > 0) {
        return callback(null, res[0].score, 0);
      }
      // Nothing found
      return callback(null, 0, 1);
    });
};

exports.saveGroup = function(data, callback) {
  // data{id, name}
  // callback(err)
  var escaped = pool.escape(data);
  poolQuery('INSERT INTO groups SET ' + escaped +
    ' ON DUPLICATE KEY UPDATE ' + escaped, callback);
};

exports.saveClass = function(data, callback) {
  // data{id, groupid, day, time, startTime, lediga,
  //      bokningsbara, totalt, aktivitet, lokal,
  //      resurs, score, ny}
  // callback(err)
  var escaped = pool.escape(data);
  poolQuery('INSERT INTO classes SET ' + escaped +
    ' ON DUPLICATE KEY UPDATE ' + escaped, callback);
};

exports.insertClassData = function(data, callback) {
  // data{classid, time, lediga, bokningsbara,
  //      waitinglistsize, totalt}
  // callback(err)
  poolQuery('INSERT INTO class_data SET ' + pool.escape(data), callback);
};

exports.getClassesForUpdate = function(callback) {
  // Add 10 min margin and get all classes that has occured
  // callback(err, res)
  var time = new Date().getTime() - 600000;
  poolQuery('SELECT id, day, time, startTime, groupid, aktivitet, lokal, resurs FROM classes WHERE startTime < ' +
    pool.escape(time) + ' ORDER BY startTime ASC', callback);
};

exports.saveScore = function(data, callback) {
  // data{day, time, startTime, aktivitet, groupid, score,
  //      lediga, bokningsbara, totalt, lokal, resurs}
  // callback(err)
  var escaped = pool.escape(data);
  poolQuery('INSERT INTO scores SET ' + escaped +
    ' ON DUPLICATE KEY UPDATE ' + escaped, callback);
};

exports.deleteClass = function(id, callback) {
  // callback(err)
  poolQuery('DELETE FROM classes WHERE ' + pool.escape({
    id: id
  }), function(err) {
    if (err) {
      return callback(err);
    }
    // Also delete its data
    poolQuery('DELETE FROM class_data WHERE ' + pool.escape({
      classid: id
    }), callback);
  });
};

exports.mergeData = function(limit) {
  // Use a negative limit to go through all
  pool.getConnection(function(err, connection) {
    if (err) {
      // No connection
      connection.release();
      return;
    }
    connection.query('SELECT id FROM classes', function(err, result) {
      if (err) {
        console.log('MergeData1', err);
      }
      // Add extra limit
      var prevTime;
      if (limit < 0) {
        // Go through all
        prevTime = 0;
      } else {
        prevTime = new Date().getTime() - limit;
      }
      async.eachSeries(result, function(item, callback) {
        connection.query('SELECT id, lediga, bokningsbara, waitinglistsize, totalt FROM class_data WHERE classid = ' +
          pool.escape(item.id) + ' AND time >= ' +
          pool.escape(prevTime) + ' ORDER BY time ASC', function(err, result) {
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
                if (curr.lediga === prev.lediga &&
                  curr.bokningsbara === prev.bokningsbara &&
                  curr.waitinglistsize === prev.waitinglistsize &&
                  curr.totalt === prev.totalt &&
                  curr.lediga === next.lediga &&
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
                connection.query('DELETE FROM class_data WHERE id IN (' +
                  pool.escape(remove) + ')', callback);
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
        console.log('MergeData2 ' + new Date(), prevTime, err);
      });
    });
  });
};

exports.getGroups = function(callback) {
  poolQuery('SELECT id, name FROM groups', callback);
};

exports.getClasses = function(id, filter, callback) {
  var currentTime = new Date().getTime();
  var query = 'SELECT id, day, time, groupid, startTime, lediga, bokningsbara, totalt, aktivitet, lokal, resurs, score, ny FROM classes WHERE startTime >= ' +
    pool.escape(currentTime);
  if (filter.length > 0) {
    query += ' AND groupid IN (' + pool.escape(filter) + ')';
  }
  query += ' ORDER BY startTime ASC LIMIT ' + pool.escape(id * 20) + ',20';
  poolQuery(query, callback);
};

exports.getClassData = function(id, callback) {
  poolQuery('SELECT time, lediga, bokningsbara, waitinglistsize, totalt FROM class_data WHERE classid = ' +
    pool.escape(id) + ' ORDER BY time ASC', callback);
};

exports.getClassInfo = function(id, callback) {
  poolQuery('SELECT id, day, time, groupid, startTime, lediga, bokningsbara, totalt, aktivitet, lokal, resurs, score, ny FROM classes WHERE id = ' +
    pool.escape(id), function(err, res) {
      callback(err, res[0]);
    });
};

exports.getScores = function(callback) {
  poolQuery('SELECT day, time, startTime, aktivitet, groupid, score, lediga, bokningsbara, totalt, lokal, resurs FROM scores ORDER BY score ASC', callback);
};
