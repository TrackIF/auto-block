var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .errorDefaults', () => {
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
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        foo: 'one',
        bar: 'beta'
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
        },
        errorDefaults: {
          'foo': 'alpha',
          'bar': 'beta'
        }
      }
    }

    controllers.run(controller)
  })
})
