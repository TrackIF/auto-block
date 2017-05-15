var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .value', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('object notation', (done) => {
    var two = (results, cb) => {
      expect(results).to.have.properties({
        a: 'beta'
      })

      cb()
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
        value: {
          'alpha': 'beta'
        }
      },
      'two': {
        func: two,
        with: {
          'a': 'one.alpha'
        }
      }
    }

    controllers.run(controller)
  })
})
