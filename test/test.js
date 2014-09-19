var assert = require('assert');
var request = require('request');
var Quartz = require('../Quartz.js');
var debug = require('debug')('test:node-quartz');
var moment = require('moment');

var config = {
  quartzURL: 'http://127.0.0.1:8090/scheduler/api'
};

describe('quartz-scheduler', function() {

  describe('jetty/quartz direct API', function() {

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
        assert.equal(response.statusCode, 405,
          'Do you have the jetty/quartz server running at ' + config.quartzURL + '?');
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
        assert.equal(parts.length,2);
        assert.equal(parts[0], 'http');
        // TODO: assert isUUID for parts[1]
        jobKey = body; // should be JSON
        done();
      });
    });

    it('should update the job that was just scheduled', function (done) {
      var payload = {
        name: 'Updated Test Job Name',
        data: {color: 'green'}
      };

      var body = {
        "jobId": jobKey.key, // Add jobId so the scheduler can find and update the existing job
        "url": "http://localhost:3000/updated",
        timestamp: moment().add(10, 'minutes').valueOf(),
        payload: JSON.stringify(payload)
      };

      request.put({url: config.quartzURL, json: body}, function (error, response, body) {
        if(error) {
          debug('Error in request.put:');
          debug(error);
        }
        assert.ok(!error, error);
        debug('body:');
        debug(body);
        assert.equal(response.statusCode, 200);
        assert(body.key);
        var parts = body.key.split('::');
        assert.equal(parts.length,2);
        assert.equal(parts[0], 'http');
        assert.equal(parts[1], jobKey.key.split('::')[1]);
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

  describe('scheduler functionality via Quartz()', function() {
    var scheduler = new Quartz(config);

    it('start', function (done) {
      scheduler.start(done)
    });

    it('should schedule a job and receive an execute request', function (done) {
      this.timeout(5000);
      var callbackCount = 0;
      scheduler.on('testTask', function (data, callback) {
        assert.ok(data);
        assert.ok(data.hello);
        assert.equal(data.hello, 'world');
        if(++callbackCount === 2) {
          done();
        }
        callback();
      });

      var when = Date.now() + 2000;
      scheduler.schedule('testTask', when, {hello: "world"}, function (err, jobId) {
        assert.ok(!err);
        assert.ok(jobId);
        assert.ok(~jobId.indexOf('::'));
        if(++callbackCount === 2) {
          done();
        }
      });
    });

    var jobKey;
    it('should schedule a job for update and execution', function (done) {
      this.timeout(5000);

      var when = moment().add(10, 'minutes').valueOf();
      scheduler.schedule('testTask #2', when, {hello: "10 minute job"}, function (err, jobId) {
        assert.ok(!err);
        assert.ok(jobId);
        assert.ok(~jobId.indexOf('::'));
        jobKey = {key: jobId};
        done();
      });
    });

    it('should update the scheduled job and receive execution', function (done) {
      this.timeout(5000);
      var callbackCount = 0;
      scheduler.on('testTask #2', function (data, callback) {
        assert.ok(data);
        assert.ok(data.hello);
        assert.equal(data.hello, '2 second job');
        if(++callbackCount === 2) {
          done();
        }
        callback();
      });

      var when = moment().add(2, 'seconds').valueOf();
      scheduler.update('testTask #2', when, {hello: "2 second job"}, jobKey, function (err, jobId) {
        assert.ok(!err);
        assert.ok(jobId);
        assert.ok(~jobId.indexOf('::'));
        assert.equal(jobId, jobKey.key); // key should not change because we're updating
        if(++callbackCount === 2) {
          done();
        }
      });
    });

  });

});
