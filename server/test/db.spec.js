process.env.NODE_ENV = 'test';

var utils = require('./utils');
var db = require('../lib/db')(utils.config);
db.init(function() {});

var mysql = require('mysql');
var should = require('should');

describe('Test init', function() {
  // Drop DB
  before(utils.DBdrop);

  it('Should init', function(done) {
    require('../lib/db')(utils.config).init(function() {
      // Check that tables was created
      var connection = mysql.createConnection({
        user: utils.config.USER,
        password: utils.config.PASSWORD,
        database: utils.config.DB
      });
      connection.connect(function(err) {
        connection.query('SHOW TABLES', function(err, res) {
          var len = res.length;
          // Convert to array
          var array = [];
          for (var i = 0; i < len; i++) {
            var item = res[i];
            array.push(item[Object.keys(item)[0]]);
          }
          len.should.equal(4);
          array.should.containEql('class_data');
          array.should.containEql('classes');
          array.should.containEql('groups');
          array.should.containEql('scores');
          connection.end(done);
        });
      });
    });
  });

  it('Should timeout', function(done) {
    var d = require('domain').create();
    d.on('error', function(err) {
      err.should.equal('Must call init in DB');
      done();
    });
    d.run(function() {
      require('../lib/db')(utils.config);
    });
  });
});

describe('Test scores', function() {
  var score = {
    day: 1,
    time: '12:30',
    classid: 123,
    startTime: new Date().getTime(),
    aktivitet: 'def',
    groupid: 456,
    score: 500,
    lediga: 0,
    bokningsbara: 0,
    totalt: 50,
    lokal: 'something',
    resurs: 'hmm'
  };

  before(utils.DBclear);

  it('Should get default score', function(done) {
    db.getScore(-1, -1, 'abc', function(err, score, isnew) {
      should.not.exist(err);
      score.should.equal(0);
      isnew.should.equal(1);
      done();
    });
  });

  it('Should save score', function(done) {
    db.saveScore(score, function(err) {
      should.not.exist(err);
      // Check that it was saved
      db.getScores(0, 20, function(err, res) {
        res.should.eql([score]);
        done();
      });
    });
  });

  it('Should get score', function(done) {
    db.getScore(score.day, score.time, score.aktivitet, function(err, s, isnew) {
      should.not.exist(err);
      s.should.equal(score.score);
      isnew.should.equal(0);
      done();
    });
  });
});

describe('Test groups', function() {
  var group = {
    id: 123,
    name: 'abc'
  };

  before(utils.DBclear);

  it('Should save group', function(done) {
    db.saveGroup(group, function(err) {
      should.not.exist(err);
      db.getGroups(function(err, res) {
        should.not.exist(err);
        res.should.eql([group]);
        done();
      });
    });
  });

  it('Should update group', function(done) {
    group.name = 'something else';
    db.saveGroup(group, function(err) {
      should.not.exist(err);
      db.getGroups(function(err, res) {
        should.not.exist(err);
        res.should.eql([group]);
        done();
      });
    });
  });
});

// saveClass
// insertClassData
// getClassesForUpdate
// deleteClass
// getClassIds
// getClassDataForMerge
// getClasses
// getClassData
// getClassInfo
// getScoreInfo
