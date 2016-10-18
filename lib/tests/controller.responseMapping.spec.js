var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .responseMapping', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support string notation (results)', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, {'two': 'three'})

    var final = (err, response) => {
      expect(err).to.not.exist
      expect(response).to.eql('three')

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: 'results.two.two',
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

  it('should support object notation (results)', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = sinon.stub().callsArgWith(1, null, {'two': 'three'})

    var final = (err, response) => {
      expect(err).to.not.exist
      expect(response).to.have.properties({
        'foo': 'one',
        'bar': {
          'zaz': 'three'
        }
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: {
        'foo': 'results.one',
        'bar.zaz': 'results.two.two'
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

  it('should support object notation (error)', (done) => {
    var one = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err).to.exist
      expect(response).to.have.properties({
        foo: {
          message: 'Sample error'
        }
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: {
        'foo': 'error'
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

  it('should support object notation (data)', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')

    var final = (err, response) => {
      expect(err).to.not.exist
      expect(response).to.have.properties({
        'foo': 'bar'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      responseMapping: {
        'foo': 'event.foo'
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
