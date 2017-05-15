var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .after', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support array notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, 'two')
    var three = sinon.stub().callsArgWith(1, null, 'three')

    var four = (results, cb) => {
      expect(one).to.be.called()
      expect(two).to.be.called()
      expect(three).to.not.be.called()
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
        func: one
      },
      'two': {
        func: two,
        after: ['one']
      },
      'three': {
        func: three,
        after: ['four']
      },
      'four': {
        func: four,
        after: ['two']
      }
    }

    controllers.run(controller)
  })

  it('should survive invalid dependency', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')

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
        func: one,
        after: ['two']
      }
    }

    controllers.run(controller)
  })
})
