var assert = require('assert')

var Quartz = require('../Quartz.js')

describe('quartz-scheduler', function() {

  var scheduler = new Quartz()

  it('start', function(done) {
    scheduler.start(done)
  })

  it('schedule', function(done) {
    var when = Date.now() + 2000
    scheduler.schedule('testTask', when, {hello: "world"}, function(err, jobId) {
      done(err)
    })
  })

  it('execute', function(done) {
    this.timeout(5000)
    scheduler.on('testTask', function(data, callback) {
      assert.ok(data)
      assert.ok(data.hello)
      assert.equal(data.hello, 'world')
      callback()
      done()
    })
  })

})
