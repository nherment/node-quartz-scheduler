'use strict';

var express = require('express');
var debug = require('debug')('node-quartz-scheduler:Server');

/**
 * needs:
 *   options.port
 *   options.queue
 */
function Server(options) {

  this._queue = options.queue;
  this._port = options.port;
  var self = this;

  if(options.app) {
    this._app = options.app;
  } else {
    this._app = express();
  }

  // Is it right that '/api/job' is hard coded here?
  // Would it be better to pull this from a property on options?
  this._app.post('/api/job', function(req, res) {

    express.json()(req, res, function() {

      if(req.body) {

        var jobName = req.body.name;
        var jobData = req.body.data;

        debug('received job [%s]. Queuing it for processing.', jobName);

        self._queue.create('job', {
          name: jobName,
          data: jobData
        }).save();

        res.send({queued: true});

      } else {

        res.send('missing body or wrong data', 400);

      }
    })
  })
}

Server.prototype.start = function(callback) {
  var self = this;
  console.log('quartz-scheduler starting on ', self._port);
  debug('quartz-scheduler starting on %s', self._port);
  this._app.listen(this._port, function() {
    console.log('quartz-scheduler listening on ', self._port);
    debug('quartz-scheduler listening on %s', self._port);
    callback();
  })
};
Server.prototype.shutdown = function(callback) {
  this._app.close(callback);
};

module.exports = Server;
