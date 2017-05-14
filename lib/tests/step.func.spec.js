var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .func', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support standard async', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(one).to.be.called()
      expect(response).to.eql('one')
      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: 'results.one',
      done: final
    }

    controller.block = {
      'one': {
        func: one
      }
    }

    controllers.run(controller)
  })

  it('should survive throw', (done) => {
    var one = (results, cb) => {
      throw new Error('HES DEAD JIM')
    }

    var final = (err, response) => {
      expect(err).to.exist()
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
      }
    }

    controllers.run(controller)
  })
})
