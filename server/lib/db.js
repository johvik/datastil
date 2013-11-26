var config = require('../config');
var mysql = require('mysql');

var connection = mysql.createConnection({
  user: config.USER,
  password: config.PASSWORD
});

function initDB() {
  connection.query('CREATE DATABASE IF NOT EXISTS datastil', function(err) {
    if (err) throw err;
    connection.query('CREATE TABLE IF NOT EXISTS datastil.classes(' +
      'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
      'time BIGINT NOT NULL,' +
      'dataid INT NOT NULL,' +
      'groupid INT NOT NULL,' +
      'startTime BIGINT NOT NULL,' +
      'endTime BIGINT NOT NULL,' +
      'aktivitet TEXT NOT NULL,' +
      'lokal TEXT NOT NULL,' +
      'resurs TEXT NOT NULL,' +
      'bokningsbara INT NOT NULL,' +
      'waitinglistsize INT NOT NULL,' +
      'totalt INT NOT NULL)', function(err) {
        if (err) throw err;
      });
  });
}
initDB();

exports.saveData = function(data) {
  var id = parseInt(data.id, 10);
  var groupid = parseInt(data.groupid, 10);
  var startTime = parseInt(data.startTime, 10);
  var endTime = parseInt(data.endTime, 10);
  var bokningsbara = parseInt(data.bokningsbara, 10);
  var waitinglistsize = parseInt(data.waitinglistsize, 10);
  var totalt = parseInt(data.totalt, 10);
  if (id !== NaN && groupid !== NaN && startTime !== NaN && endTime !== NaN && 'aktivitet' in data && 'lokal' in data && 'resurs' in data && bokningsbara !== NaN && waitinglistsize !== NaN && totalt !== NaN) {
    connection.query('INSERT INTO datastil.classes SET ?', {
      time: new Date().getTime(),
      dataid: id,
      groupid: groupid,
      startTime: startTime,
      endTime: endTime,
      aktivitet: data.aktivitet,
      lokal: data.lokal,
      resurs: data.resurs,
      bokningsbara: bokningsbara,
      waitinglistsize: waitinglistsize,
      totalt: totalt
    }, function(err, result) {
      if (err) console.log('Query', err);
    });
  } else {
    console.log('Fields are missing...');
  }
}
