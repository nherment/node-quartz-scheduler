
var Quartz = require('./Quartz.js')

var scheduler = new Quartz({monitor: true})

scheduler.start(function() {})

var in5Seconds = Date.now() + 2000
  scheduler.schedule('testTask', in5Seconds, {hello: "world"}, function(err, jobId) {
  console.log(err, jobId)
})

scheduler.on('testTask', function(data, callback) {
  console.log(data)
  callback(new Error(new Date()))
})
