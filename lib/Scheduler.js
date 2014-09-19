
var request = require('request');
var debug = require('debug')('Scheduler');

/**
 * port
 * queue
 */
function Scheduler(options) {

  this._callbackURL = options.callbackURL;
  this._quartzURL = options.quartzURL;

  debug('Scheduler setup with callbackUrl: %s and quartzUrl: %s', this._callbackURL, this._quartzURL);
}

Scheduler.prototype.schedule = function(jobName, date, data, callback) {
  debug('schedule job with jobName: %s, date: %s, and data:', jobName, date);
  debug(data);

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
      debug('Error communicating with quartz scheduler during schedule:');
      debug(error);
      callback(error, undefined)
    } else if(response.statusCode !== 200) {
      err = new Error('Failed to schedule job ['+jobName+']. Http error ['+response.statusCode+'] '+JSON.stringify(body))
      debug(err);
      callback(err, undefined);
    } else {
      callback(undefined, body.key);
    }
  })
};

Scheduler.prototype.update = function(jobName, date, data, jobKey, callback) {
  debug('schedule job with jobName: %s, date: %s, jobKey: %s and data:', jobName, date, jobKey.key);
  debug(data);

  var payload = {
    name: jobName,
    data: data
  };

  var body = {
    jobId: jobKey.key,
    url: this._callbackURL,
    timestamp: date.getTime(),
    payload: JSON.stringify(payload)
  };

  request.put({url:this._quartzURL, json: body}, function (error, response, body) {
    if(error) {
      debug('Error communicating with quartz scheduler during update:');
      debug(error);
      callback(error, undefined);
    } else if(response.statusCode !== 200) {
      err = new Error('Failed to update job ['+jobName+']. Http error ['+response.statusCode+'] '+JSON.stringify(body))
      debug.error(err);
      callback(err, undefined);
    } else {
      callback(undefined, body.key);
    }
  })
};

Scheduler.prototype.cancel = function(jobKey, callback) {
  debug('delete/cancel job with jobKey: %s', jobKey.key);
  var deleteUrl = this._quartzURL + '/' + jobKey.key;
  request.del({url:deleteUrl}, function (error, response, body) {
    if(error) {
      debug('Error communicating with quartz scheduler during delete:');
      debug(error);
      callback(error, undefined);
    } else if(response.statusCode !== 200) {
      err = new Error('Failed to delete jobKey ['+jobKey.key+']. Http error ['+response.statusCode+'] '+JSON.stringify(body));
      debug.error(err);
      callback(err, undefined);
    } else {
      callback(undefined, body);
    }
  });
};

module.exports = Scheduler;
