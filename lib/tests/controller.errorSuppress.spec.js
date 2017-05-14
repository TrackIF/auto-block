var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .errorSuppress', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('suppress using default', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.not.exist()

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
        errorDefaults: {
          'retry': false
        }
      }
    }

    controllers.run(controller)
  })

  it('suppress using string notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.not.exist()

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      errorSuppress: 'data.suppress',
      done: final
    }

    controller.block = {
      'one': {
        func: one
      },
      'two': {
        func: two,
        errorDefaults: {
          'suppress': true
        }
      }
    }

    controllers.run(controller)
  })

  it('suppress using object notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.not.exist()

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      errorSuppress: {
        'data.suppress': true
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one
      },
      'two': {
        func: two,
        errorDefaults: {
          'suppress': true
        }
      }
    }

    controllers.run(controller)
  })
})
