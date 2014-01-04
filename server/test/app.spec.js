process.env.NODE_ENV = 'test';

var app = require('../');

var utils = require('./utils');
var request = require('superagent');
var should = require('should');

describe('Request index.html', function() {
  var indexContent = utils.getDistFileContent('index.html');

  before(function(done) {
    // Give server time to start
    setTimeout(done, 500);
  });
  it('should get root', function(done) {
    request.get(utils.address + '/').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(indexContent);
      done();
    });
  });

  it('should get index.html', function(done) {
    request.get(utils.address + '/somerandompath').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(indexContent);
      done();
    });
  });

  it('should del index.html', function(done) {
    request.del(utils.address + '/some/random/path').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(indexContent);
      done();
    });
  });
});

describe('Request static', function() {
  it('should get datastil.js', function(done) {
    request.get(utils.address + '/static/datastil.js').buffer().end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(utils.getDistFileContent('datastil.js'));
      done();
    });
  });

  it('should get favicon', function(done) {
    request.get(utils.address + '/favicon.ico').buffer().end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(utils.getDistFileContent('favicon.ico'));
      done();
    });
  });
});

describe('Request routes (empty)', function() {
  // Make sure DB is empty
  before(utils.DBclear);

  it('should get groups', function(done) {
    request.get(utils.address + '/groups').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([]);
      done();
    });
  });

  it('should get classes', function(done) {
    request.get(utils.address + '/classes/0').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([]);
      done();
    });
  });

  it('should not get class', function(done) {
    request.get(utils.address + '/class/0').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(404);
      done();
    });
  });

  it('should not get classinfo', function(done) {
    request.get(utils.address + '/class/0/info').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(404);
      done();
    });
  });

  it('should get scores', function(done) {
    request.get(utils.address + '/scores').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([]);
      done();
    });
  });
});

describe('Request routes', function() {
  var time = new Date().getTime() + 600000;

  before(function(done) {
    // Put data in DB
    utils.DBtestData(time, done);
  });

  it('should get groups', function(done) {
    request.get(utils.address + '/groups').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([{
        id: 123,
        name: 'abc'
      }]);
      done();
    });
  });
  it('should get classes', function(done) {
    request.get(utils.address + '/classes/0').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([{
        id: 123,
        day: 0,
        time: '10:00',
        groupid: 123,
        startTime: time,
        lediga: 10,
        bokningsbara: 10,
        totalt: 10,
        aktivitet: 'abc',
        lokal: 'ABC',
        resurs: 'def',
        score: 0,
        ny: 1
      }]);
      done();
    });
  });

  it('should get class', function(done) {
    request.get(utils.address + '/class/123').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([{
        time: time,
        lediga: 10,
        bokningsbara: 10,
        waitinglistsize: 0,
        totalt: 10
      }]);
      done();
    });
  });

  it('should get classinfo', function(done) {
    request.get(utils.address + '/class/123/info').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql({
        id: 123,
        day: 0,
        time: '10:00',
        groupid: 123,
        startTime: time,
        lediga: 10,
        bokningsbara: 10,
        totalt: 10,
        aktivitet: 'abc',
        lokal: 'ABC',
        resurs: 'def',
        score: 0,
        ny: 1
      });
      done();
    });
  });

  it('should get scores', function(done) {
    request.get(utils.address + '/scores').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.body.should.eql([{
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
      }]);
      done();
    });
  });
});
