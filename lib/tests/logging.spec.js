var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('logging', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('.onStart', () => {
    it('called once', (done) => {
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, null, 'two')

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        onStart: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.not.exist
        expect(response).to.not.exist

        expect(logging).to.be.calledOnce
        expect(logging.args[0]).to.have.properties([
          {
            event: controller.data.event
          }
        ])

        done()
      }

      controllers.run(controller)
    })
  })

  describe('.onSuccess', () => {
    it('called once', (done) => {
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, null, 'two')

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        responseMapping: 'results.two',
        onSuccess: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.not.exist
        expect(response).to.exist

        expect(logging).to.be.calledOnce
        expect(logging.args[0]).to.have.properties([
          'two',
          {
            event: controller.data.event,
            response: 'two',
            error: null,
            results: {
              'one': 'one',
              'two': 'two'
            }
          }
        ])

        done()
      }

      controllers.run(controller)
    })

    it('not called if error', (done) => {
      var sampleError = new Error('sample error')
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, sampleError, null)

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        responseMapping: 'results.two',
        onSuccess: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.exist
        expect(response).to.not.exist

        expect(logging).to.not.be.called

        done()
      }

      controllers.run(controller)
    })
  })

  describe('.onFailure', () => {
    it('not called if success', (done) => {
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, null, 'two')

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        responseMapping: 'results.two',
        onFailure: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.not.exist
        expect(response).to.exist

        expect(logging).to.not.be.called

        done()
      }

      controllers.run(controller)
    })

    it('called once if error', (done) => {
      var sampleError = new Error('sample error')
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, sampleError, null)

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        responseMapping: 'results.two',
        onFailure: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.exist
        expect(response).to.not.exist

        expect(logging).to.be.calledOnce
        expect(logging.args[0]).to.have.properties([
          sampleError,
          {
            event: controller.data.event,
            response: null,
            error: sampleError,
            results: {
              'one': 'one',
              'two': null
            }
          }
        ])

        done()
      }

      controllers.run(controller)
    })
  })

  describe('.onStartStep', () => {
    it('called once per step', (done) => {
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, null, 'two')

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        onStartStep: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.not.exist
        expect(response).to.not.exist

        expect(logging).to.be.calledTwice
        expect(logging).to.be.calledWith('one', controller.data)
        expect(logging).to.be.calledWith('two', controller.data)

        done()
      }

      controllers.run(controller)
    })
  })

  describe('.finishStep', () => {
    it('called once per step', (done) => {
      var one = sinon.stub().callsArgWith(1, null, 'one')
      var two = sinon.stub().callsArgWith(1, null, 'two')

      var logging = sinon.stub()

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        onFinishStep: logging
      }

      controller.block = {
        'one': {
          func: one
        },
        'two': {
          func: two
        }
      }

      controller.done = (err, response) => {
        expect(err).to.not.exist
        expect(response).to.not.exist

        expect(logging).to.be.calledTwice

        expect(logging).to.be.calledWith('one', controller.data)
        expect(logging).to.be.calledWith('two', controller.data)

        var actual = logging.args[0][2]
        expect(actual).to.have.properties({
          error: false,
          result: true
        })
        expect(actual).to.have.property('timer')

        actual = logging.args[1][2]
        expect(actual).to.have.properties({
          error: false,
          result: true
        })
        expect(actual).to.have.property('timer')

        done()
      }

      controllers.run(controller)
    })
  })
})
