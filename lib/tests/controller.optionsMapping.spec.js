var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .optionsMapping', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation (data)', (done) => {
    var one = (options, callback) => {
      expect(options).to.have.properties({
        'foo': 'bar'
      })
      callback(null, 'one')
    }

    var final = (err, response) => {
      expect(err).to.not.exist
      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      optionsMapping: {
        'foo': 'event.foo'
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one,
        with: {
          'foo': 'options.foo'
        }
      }
    }

    controllers.run(controller)
  })
})
