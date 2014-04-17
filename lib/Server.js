
var express = require('express')


/**
 * needs:
 *   options.port
 *   options.queue
 */
function Server(options) {

  this._queue = options.queue
  this._port = options.port
  var self = this

  if(options.app) {
    this._app = options.app
  } else {
    this._app = express()
  }

  this._app.post('/api/job', function(req, res) {

    express.json()(req, res, function() {

      if(req.body) {

        var jobName = req.body.name
        var jobData = req.body.data

        console.log('received job [', jobName, ']. Queuing it for processing.')

        self._queue.create('job', {
          name: jobName,
          data: jobData
        }).save()

        res.send({queued: true})

      } else {

        res.send('missing body or wrong data', 400)

      }
    })
  })
}

Server.prototype.start = function(callback) {
  var self = this
  console.log('quartz-scheduler starting on ', self._port)
  this._app.listen(this._port, function() {
    console.log('quartz-scheduler listening on ', self._port)
    callback()
  })
}
Server.prototype.shutdown = function(callback) {
  this._app.close(callback)
}

module.exports = Server
