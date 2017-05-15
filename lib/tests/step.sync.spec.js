var chai = require('chai')
var Promise = require('bluebird')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .sync', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support sync', (done) => {
    var one = sinon.stub().returns('one')

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
        sync: one
      }
    }

    controllers.run(controller)
  })

  it('should support promises', (done) => {
    var p = Promise.resolve('one')
    var one = sinon.stub().returns(p)

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
        sync: one
      }
    }

    controllers.run(controller)
  })

  it('should survive sync throw', (done) => {
    var one = (results) => {
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
        sync: one
      }
    }

    controllers.run(controller)
  })

  it('should support promises .reject', (done) => {
    var one = () => Promise.reject(new Error('fake error'))

    var final = (err, response) => {
      expect(err).to.exist()
      // expect(one).to.be.called()
      expect(response).to.not.exist()
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
        sync: one
      }
    }

    controllers.run(controller)
  })
})
