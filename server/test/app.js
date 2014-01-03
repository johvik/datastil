process.env.NODE_ENV = 'test';

var app = require('../');
var config = require('../config_test.js');

var fs = require('fs');
var path = require('path');
var request = require('superagent');
var should = require('should');

describe('Request index.html', function() {
  var address = 'http://localhost:' + config.PORT;
  var indexContent;

  before(function(done) {
    indexContent = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html')).toString();
    // Give server time to start
    setTimeout(done, 250);
  });
  it('should get root', function(done) {
    request.get(address + '/').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(indexContent);
      done();
    });
  });

  it('should get index.html', function(done) {
    request.get(address + '/somerandompath').end(function(err, res) {
      should.not.exist(err);
      res.should.have.status(200);
      res.text.should.equal(indexContent);
      done();
    });
  });
});
