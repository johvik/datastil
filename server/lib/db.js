var config = require('../config');
var mysql = require('mysql');

var connection = mysql.createConnection({
  user: config.USER,
  password: config.PASSWORD
});

function initDB() {
  connection.query('CREATE DATABASE IF NOT EXISTS datastil', function(err) {
    if (err) throw err;
    connection.query('CREATE TABLE IF NOT EXISTS datastil.groups(' +
      'id INT NOT NULL PRIMARY KEY,' +
      'name TEXT NOT NULL)', function(err) {
        if (err) throw err;
        connection.query('CREATE TABLE IF NOT EXISTS datastil.classes(' +
          'id INT NOT NULL PRIMARY KEY,' +
          'groupid INT NOT NULL,' +
          'startTime BIGINT NOT NULL,' +
          'endTime BIGINT NOT NULL,' +
          'bokningsbara INT NOT NULL,' +
          'aktivitet TEXT NOT NULL,' +
          'lokal TEXT NOT NULL,' +
          'resurs TEXT NOT NULL)', function(err) {
            if (err) throw err;
            connection.query('CREATE TABLE IF NOT EXISTS datastil.class_data(' +
              'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
              'classid INT NOT NULL,' +
              'time BIGINT NOT NULL,' +
              'bokningsbara INT NOT NULL,' +
              'waitinglistsize INT NOT NULL,' +
              'totalt INT NOT NULL)', function(err) {
                if (err) throw err;
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
  var endTime = parseInt(data.endTime, 10);
  var bokningsbara = parseInt(data.bokningsbara, 10);
  var waitinglistsize = parseInt(data.waitinglistsize, 10);
  var totalt = parseInt(data.totalt, 10);
  if (!isNaN(id) && 'group' in data && !isNaN(groupid) && !isNaN(startTime) && !isNaN(endTime) && 'aktivitet' in data && 'lokal' in data && 'resurs' in data && !isNaN(bokningsbara) && !isNaN(waitinglistsize) && !isNaN(totalt)) {
    // Update groups
    connection.query('INSERT INTO datastil.groups SET ? ON DUPLICATE KEY UPDATE ' + mysql.escape({
      name: data.group
    }), {
      id: groupid,
      name: data.group
    }, function(err, result) {
      if (err) console.log('Groups', err);
      // Update classes
      connection.query('INSERT INTO datastil.classes SET ? ON DUPLICATE KEY UPDATE ' + mysql.escape({
        groupid: groupid,
        startTime: startTime,
        endTime: endTime,
        bokningsbara: bokningsbara,
        aktivitet: data.aktivitet,
        lokal: data.lokal,
        resurs: data.resurs
      }), {
        id: id,
        groupid: groupid,
        startTime: startTime,
        endTime: endTime,
        bokningsbara: bokningsbara,
        aktivitet: data.aktivitet,
        lokal: data.lokal,
        resurs: data.resurs
      }, function(err, result) {
        if (err) console.log('Classes', err);
        // Update data
        connection.query('INSERT INTO datastil.class_data SET ?', {
            classid: id,
            time: new Date().getTime(),
            bokningsbara: bokningsbara,
            waitinglistsize: waitinglistsize,
            totalt: totalt
          },
          function(err, result) {
            if (err) console.log('Data', err);
            callback(err);
          });
      });
    });
  } else {
    console.log('Fields are missing...');
  }
};

exports.getGroups = function(callback) {
  connection.query('SELECT id, name FROM datastil.groups', callback);
};

exports.getClasses = function(id, filter, callback) {
  var query = 'SELECT id, startTime, endTime, bokningsbara, aktivitet, lokal, resurs FROM datastil.classes WHERE startTime >= ' + mysql.escape(new Date().getTime());
  if (filter.length > 0) {
    query += ' AND groupid IN (' + mysql.escape(filter) + ')';
  }
  query += ' ORDER BY startTime ASC LIMIT ' + mysql.escape(id * 20) + ',20';
  connection.query(query, callback);
};

exports.getClassData = function(id, callback) {
  connection.query('SELECT time, bokningsbara, waitinglistsize, totalt FROM datastil.class_data WHERE classid = ' + mysql.escape(id), callback);
};
