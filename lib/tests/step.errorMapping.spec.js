var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .errorMapping', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation (results)', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        foo: 'one'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one
      },
      'two': {
        func: two,
        after: ['one'],
        errorMapping: {
          'foo': 'results.one'
        }
      }
    }

    controllers.run(controller)
  })

  it('should support object notation (error)', (done) => {
    var one = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.have.properties({
        message: 'Sample error'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one,
        errorMapping: {
          'error': 'error'
        }
      }
    }

    controllers.run(controller)
  })

  it('should support object notation (data)', (done) => {
    var one = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        foo: 'bar'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one,
        errorMapping: {
          'foo': 'event.foo'
        }
      }
    }

    controllers.run(controller)
  })
})
