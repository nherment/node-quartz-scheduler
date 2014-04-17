
var request = require('request')


/**
 * port
 * queue
 */
function Scheduler(options) {

  this._callbackURL = options.callbackURL
  this._quartzURL = options.quartzURL

}

Scheduler.prototype.schedule = function(jobName, date, data, callback) {

  var payload = {
    name: jobName,
    data: data
  }

  var body = {
    url: this._callbackURL,
    timestamp: date.getTime(),
    payload: JSON.stringify(payload)
  }

  request.post({url:this._quartzURL, json: body}, function (error, response, body) {
    if(error) {

      // TODO: error should be an instance of Error
      callback(error, undefined)
    } else if(response.statusCode !== 200) {
      err = new Error('Failed to schedule job ['+jobName+']. Http error ['+response.statusCode+'] '+JSON.stringify(body))
      console.error(err)
      callback(err, undefined)
    } else {
      callback(undefined, body.key)
    }
  })
}

Scheduler.prototype.cancel = function(jobId, callback) {
  setImmediate(function() {
    callback(undefined)
  })
}

module.exports = Scheduler
