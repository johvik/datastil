var mysql = require('mysql');

module.exports = function(config) {
  // Check config file
  if (!('USER' in config &&
    'PASSWORD' in config &&
    'DB' in config)) {
    throw 'Missing parameters in config file';
  }

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
                  connection.query('CREATE TABLE IF NOT EXISTS scores(' +
                    'day INT NOT NULL,' +
                    'time CHAR(5) NOT NULL,' +
                    'classid INT NOT NULL,' +
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

  // Exported functions
  return {
    init: function(callback) {
      clearTimeout(mustCall);
      createDB(function(err) {
        if (err) {
          throw err;
        }
        createTables(callback);
      });
    },
    getScore: function(day, time, aktivitet, callback) {
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
    },
    saveGroup: function(data, callback) {
      // data{id, name}
      // callback(err)
      var escaped = pool.escape(data);
      poolQuery('INSERT INTO groups SET ' + escaped +
        ' ON DUPLICATE KEY UPDATE ' + escaped, callback);
    },
    saveClass: function(data, callback) {
      // data{id, groupid, day, time, startTime, lediga,
      //      bokningsbara, totalt, aktivitet, lokal,
      //      resurs, score, ny}
      // callback(err)
      var escaped = pool.escape(data);
      poolQuery('INSERT INTO classes SET ' + escaped +
        ' ON DUPLICATE KEY UPDATE ' + escaped, callback);
    },
    insertClassData: function(data, callback) {
      // data{classid, time, lediga, bokningsbara,
      //      waitinglistsize, totalt}
      // callback(err)
      pool.getConnection(function(err, connection) {
        if (err) {
          connection.release();
          return callback(err);
        }
        // Get last two data points
        connection.query('SELECT id, classid, time, lediga, bokningsbara, waitinglistsize, totalt FROM class_data WHERE classid = ' +
          pool.escape(data.classid) +
          ' ORDER BY time DESC LIMIT 2', function(err, res) {
            if (err) {
              connection.release();
              return callback(err);
            }
            if (res.length >= 1 && data.time <= res[0].time) {
              // Make sure the new data is indeed newer
              connection.release();
              return callback('New point before old point');
            }
            if (res.length === 2 && (
              res[0].lediga === data.lediga &&
              res[0].bokningsbara === data.bokningsbara &&
              res[0].waitinglistsize === data.waitinglistsize &&
              res[0].totalt === data.totalt &&
              res[1].lediga === data.lediga &&
              res[1].bokningsbara === data.bokningsbara &&
              res[1].waitinglistsize === data.waitinglistsize &&
              res[1].totalt === data.totalt)) {
              // Middle point can be removed
              data.id = res[0].id; // Overwrite latest point
            }
            // Save the data
            var escaped = pool.escape(data);
            connection.query('INSERT INTO class_data SET ' + escaped +
              ' ON DUPLICATE KEY UPDATE ' + escaped, function(err) {
                connection.release();
                return callback(err);
              });
          });
      });
    },
    getClassesForUpdate: function(callback) {
      // Add 10 min margin and get all classes that has occured
      // callback(err, res)
      var time = new Date().getTime() - 600000;
      poolQuery('SELECT id, day, time, startTime, groupid, aktivitet, lokal, resurs FROM classes WHERE startTime < ' +
        pool.escape(time) + ' ORDER BY startTime ASC', callback);
    },
    saveScore: function(data, callback) {
      // data{day, time, classid, startTime, aktivitet, groupid, score,
      //      lediga, bokningsbara, totalt, lokal, resurs}
      // callback(err)
      pool.getConnection(function(err, connection) {
        if (err) {
          connection.release();
          return callback(err);
        }
        connection.query('SELECT classid FROM scores WHERE day = ' +
          pool.escape(data.day) + ' AND time = ' +
          pool.escape(data.time) + ' AND aktivitet = ' +
          pool.escape(data.aktivitet), function(err, res) {
            if (err) {
              connection.release();
              return callback(err);
            }
            var escaped = pool.escape(data);
            connection.query('INSERT INTO scores SET ' + escaped +
              ' ON DUPLICATE KEY UPDATE ' + escaped, function(err) {
                if (err) {
                  connection.release();
                  return callback(err);
                }
                var escaped = pool.escape(data);
                if (res && res.length > 0) {
                  // Remove old
                  connection.query('DELETE FROM class_data WHERE ' +
                    pool.escape({
                      classid: res[0].classid
                    }), function(err) {
                      connection.release();
                      return callback(err);
                    });
                } else {
                  // Nothing to delete
                  connection.release();
                  return callback(null);
                }
              });
          });
      });

    },
    deleteClass: function(id, removeData, callback) {
      // callback(err)
      pool.getConnection(function(err, connection) {
        if (err) {
          connection.release();
          return callback(err);
        }
        connection.query('DELETE FROM classes WHERE ' + pool.escape({
          id: id
        }), function(err) {
          if (err) {
            connection.release();
            return callback(err);
          }
          if (removeData !== true) {
            connection.release();
            return callback(null);
          }
          // Also delete its data
          connection.query('DELETE FROM class_data WHERE ' + pool.escape({
            classid: id
          }), function(err) {
            connection.release();
            return callback(err);
          });
        });
      });
    },
    getClassIds: function(callback) {
      // callback(err, res)
      poolQuery('SELECT id FROM classes', callback);
    },
    getClassDataForMerge: function(id, time, callback) {
      // callback(err, res)
      poolQuery('SELECT id, lediga, bokningsbara, waitinglistsize, totalt FROM class_data WHERE classid = ' +
        pool.escape(id) + ' AND time >= ' +
        pool.escape(time) + ' ORDER BY time ASC', callback);
    },
    getGroups: function(callback) {
      poolQuery('SELECT id, name FROM groups', callback);
    },
    getClasses: function(id, filter, pageSize, callback) {
      var currentTime = new Date().getTime();
      var query = 'SELECT id, day, time, groupid, startTime, lediga, bokningsbara, totalt, aktivitet, lokal, resurs, score, ny FROM classes WHERE startTime >= ' +
        pool.escape(currentTime);
      if (filter.length > 0) {
        query += ' AND groupid IN (' + pool.escape(filter) + ')';
      }
      query += ' ORDER BY startTime ASC LIMIT ' + pool.escape(id * pageSize) + ',' + pool.escape(pageSize);
      poolQuery(query, callback);
    },
    getClassData: function(id, callback) {
      poolQuery('SELECT time, lediga, bokningsbara, waitinglistsize, totalt FROM class_data WHERE classid = ' +
        pool.escape(id) + ' ORDER BY time ASC', callback);
    },
    getClassInfo: function(id, callback) {
      poolQuery('SELECT id, day, time, groupid, startTime, lediga, bokningsbara, totalt, aktivitet, lokal, resurs, score, ny FROM classes WHERE id = ' +
        pool.escape(id), function(err, res) {
          callback(err, res[0]);
        });
    },
    getScores: function(id, pageSize, callback) {
      poolQuery('SELECT day, time, classid, startTime, aktivitet, groupid, score, lediga, bokningsbara, totalt, lokal, resurs FROM scores ORDER BY score DESC LIMIT ' +
        pool.escape(id * pageSize) + ',' +
        pool.escape(pageSize), callback);
    },
    getScoreInfo: function(id, callback) {
      poolQuery('SELECT classid, day, time, groupid, startTime, lediga, bokningsbara, totalt, aktivitet, lokal, resurs, score FROM scores WHERE classid = ' +
        pool.escape(id), function(err, res) {
          callback(err, res[0]);
        });
    }
  };
};
