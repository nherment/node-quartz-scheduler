'use strict';

var request = require('request');

/**
 * port
 * queue
 */
function Scheduler(options) {

  this._callbackURL = options.callbackURL;
  this._quartzURL = options.quartzURL;

}

Scheduler.prototype.schedule = function(jobName, date, data, callback) {

  var payload = {
    name: jobName,
    data: data
  };

  var body = {
    url: this._callbackURL,
    timestamp: date.getTime(),
    payload: JSON.stringify(payload)
  };

  request.post({url:this._quartzURL, json: body}, function (error, response, body) {
    if(error) {
      callback(error, undefined)
    } else if(response.statusCode !== 200) {
      var err = new Error('Failed to schedule job ['+jobName+']. Http error ['+response.statusCode+'] '+JSON.stringify(body));
      callback(err, undefined);
    } else {
      callback(undefined, body.key);
    }
  })
};

Scheduler.prototype.update = function(jobName, date, data, jobId, callback) {

  var payload = {
    name: jobName,
    data: data
  };

  var body = {
    jobId: jobId,
    url: this._callbackURL,
    timestamp: date.getTime(),
    payload: JSON.stringify(payload)
  };

  request.put({url:this._quartzURL, json: body}, function (error, response, body) {
    if(error) {
      callback(error, undefined);
    } else if(response.statusCode !== 200) {
      var err = new Error('Failed to update jobId ['+jobId+'] with name ['+jobName+']. Http error ['+response.statusCode+'] '+JSON.stringify(body));
      callback(err, undefined);
    } else {
      callback(undefined, body.key);
    }
  })
};

Scheduler.prototype.cancel = function(jobKey, callback) {
  var deleteUrl = this._quartzURL + '/' + jobKey;
  request.del({url:deleteUrl}, function (err, response, body) {
    if(err) {
      callback(err, undefined);
    } else if(response.statusCode !== 200) {
      err = new Error('Failed to delete jobKey ['+jobKey+']. Http error ['+response.statusCode+'] '+JSON.stringify(body));
      callback(err, undefined);
    } else {
      callback(undefined, body);
    }
  });
};

module.exports = Scheduler;
