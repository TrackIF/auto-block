var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .errorSuppress', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      var err = new Error('Sample error')
      err.status = 404
      cb(err)
    }

    var final = (err, response) => {
      expect(err).to.not.exist()
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
        errorSuppress: {
          'error.status': 404
        }
      }
    }

    controllers.run(controller)
  })

  it('should support array notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      var err = new Error('Sample error')
      err.status = 404
      cb(err)
    }

    var final = (err, response) => {
      expect(err).to.not.exist()
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
        errorSuppress: ['error.status']
      }
    }

    controllers.run(controller)
  })

  it('should not suppress if check fails', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      var err = new Error('Sample error')
      cb(err)
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
        func: one
      },
      'two': {
        func: two,
        after: ['one'],
        errorSuppress: ['error.status']
      }
    }

    controllers.run(controller)
  })
})
