var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .done', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('called', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, 'two')

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
        func: two
      }
    }

    controllers.run(controller)
  })

  it('called with error', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.exist()
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
        func: two
      }
    }

    controllers.run(controller)
  })

  it('called with exception', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      throw new Error('Sample error')
    }

    var final = (err, response) => {
      expect(err).to.exist()
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
        func: two
      }
    }

    controllers.run(controller)
  })

  it('overrides parameter', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, 'two')

    var other = sinon.stub()

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.not.exist()

      expect(other).to.not.be.called()

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
        func: two
      }
    }

    controllers.run(controller, other)
  })

  it('falls back to parameter', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, 'two')

    var other = sinon.stub()

    var final = (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.not.exist()

      expect(other).to.not.be.called()

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      }
    }

    controller.block = {
      'one': {
        func: one
      },
      'two': {
        func: two
      }
    }

    controllers.run(controller, final)
  })
})
