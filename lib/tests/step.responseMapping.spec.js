var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .responseMapping', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation (results)', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, { 'two': 'two' })

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.have.properties({
        foo: 'two'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: 'results.two',
      done: final
    }

    controller.block = {
      'one': {
        func: one
      },
      'two': {
        func: two,
        after: ['one'],
        responseMapping: {
          'foo': 'result.two'
        }
      }
    }

    controllers.run(controller)
  })
})
