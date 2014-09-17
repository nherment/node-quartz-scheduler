var assert = require('assert');
var request = require('request');
var Quartz = require('../Quartz.js');
var debug = require('debug')('test:node-quartz');
var moment = require('moment');

var config = {
  quartzURL: 'http://127.0.0.1:8090/scheduler/api'
};

describe('quartz-scheduler', function() {

  describe('jetty/quartz setup check', function() {

    it('should check to see if the quartz scheduler is running at the given address', function (done) {
      this.timeout(5000);
      request.get(config.quartzURL, function (error, response, body) {
        if(error) {
          debug('Error in request.get:');
          debug(error);
        }
        assert.ok(!error);
        // Expect a 405 back from the call because the service does not
        // support the HTTP GET verb - this is correct behavior.
        assert.equal(response.statusCode, 405, 'Do you have the jetty/quartz server running?');
        debug(body);
        done();
      });
    });

    var jobKey;
    it('should schedule a job and return a group and name', function (done) {
      var payload = {
        name: 'Test Job Name',
        data: {color: 'blue'}
      };

      var body = {
        "url": "http://localhost:3000",
        timestamp: moment().add(10, 'minutes').valueOf(),
        payload: JSON.stringify(payload)
      };

      request.post({url: config.quartzURL, json: body}, function (error, response, body) {
        if(error) {
          debug('Error in request.post:');
          debug(error);
        }
        assert.ok(!error, error);
        debug('body:');
        debug(body);
        assert.equal(response.statusCode, 200);
        assert(body.key);
        var parts = body.key.split('::');
        assert.equal(parts[0], 'http');
        // TODO: assert isUUID for parts[1]
        jobKey = body; // should be JSON
        done();
      });
    });

    it('should cancel a job and return success', function (done) {
      var deleteUrl = config.quartzURL + '/' + jobKey.key;
      request.del({url:deleteUrl}, function (error, response, body) {
        assert.ok(!error, error);
        assert.equal(response.statusCode, 200);
        debug('body:');
        debug(body);
        done();
      });
    });

  });

  describe('scheduler functionality', function() {
    var scheduler = new Quartz(config);

    it('start', function (done) {
      scheduler.start(done)
    });

    it('schedule', function (done) {
      var when = Date.now() + 2000;
      scheduler.schedule('testTask', when, {hello: "world"}, function (err/*, jobId*/) {
        done(err)
      })
    });

    it('execute', function (done) {
      this.timeout(5000);
      scheduler.on('testTask', function (data, callback) {
        assert.ok(data);
        assert.ok(data.hello);
        assert.equal(data.hello, 'world');
        callback();
        done();
      })
    })
  });

});
