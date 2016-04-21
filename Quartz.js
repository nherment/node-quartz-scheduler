'use strict';

var kue = require('kue');
var _ = require('underscore');

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Server = require('./lib/Server.js');
var Scheduler = require('./lib/Scheduler.js');

function Quartz(config) {
  EventEmitter.call(this);

  config = _.extend({
    queue: {
      redis: {
        port: 6379,
        host: '127.0.0.1'
      }
    },
    listen: 8001,
    callbackURL: 'http://127.0.0.1:8001/api/job',
    quartzURL: 'http://127.0.0.1:8080/api',
    concurrency: 5,
    monitor: false
  }, config || {});

  var self = this;

  this._queue = kue.createQueue(config.queue);

  var app;
  if(config.monitor) {
    app = kue.app
  }

  this._server = new Server({port: config.listen, queue: this._queue, app: app});
  this._scheduler = new Scheduler({queue: this._queue, callbackURL: config.callbackURL, quartzURL: config.quartzURL});

  this._queue.process('job', config.concurrency || 5, function(job, done) {
    self.emit(job.data.name, job.data.key, job.data.data, done);
  })
}

util.inherits(Quartz, EventEmitter);

Quartz.prototype.schedule = function(jobName, date, data, callback) {
  if(_.isNumber(date)) {
    date = new Date(date);
  }
  this._scheduler.schedule(jobName, date, data, callback);
};

// jobId example: 'group::name'
Quartz.prototype.update = function(jobName, date, data, jobId, callback) {
  if(_.isNumber(date)) {
    date = new Date(date);
  }
  this._scheduler.update(jobName, date, data, jobId, callback);
};

Quartz.prototype.cancel = function(jobId, callback) {
  this._scheduler.cancel(jobId, callback);
};

Quartz.prototype.start = function(callback) {
  this._server.start(callback);
};

Quartz.prototype.shutdown = function() {
  this._server.shutdown();
};

module.exports = Quartz;
