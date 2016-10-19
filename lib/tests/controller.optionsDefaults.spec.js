var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .optionsDefaults', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation', (done) => {
    var one = (options, callback) => {
      expect(options).to.have.properties({
        'foo': 'bar',
        'alpha': 'beta'
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
      optionsDefaults: {
        'foo': 'zaz',
        'alpha': 'beta'
      },
      done: final
    }

    controller.block = {
      'one': {
        func: one,
        with: {
          'foo': 'options.foo',
          'alpha': 'options.alpha'
        }
      }
    }

    controllers.run(controller)
  })

  it('should support nested paths', (done) => {
    var one = (options, callback) => {
      expect(options).to.have.properties({
        'foo': 'beta'
      })
      callback(null, 'one')
    }

    var final = (err, response) => {
      expect(err).to.not.exist
      done()
    }

    var controller = {
      data: {
        event: { foo: 'alpha' }
      },
      optionsMapping: {
        'foo': 'event.foo.bar'
      },
      optionsDefaults: {
        'foo': 'beta'
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

  it('should not override explicit options step', (done) => {
    var one = (options, callback) => {
      expect(options).to.have.properties({
        'foo': 'lee',
        'alpha': undefined
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
      optionsDefaults: {
        'foo': 'zaz',
        'alpha': 'beta'
      },
      done: final
    }

    controller.block = {
      'options': {
        value: {
          'foo': 'lee'
        }
      },
      'one': {
        func: one,
        with: {
          'foo': 'options.foo',
          'alpha': 'options.alpha'
        }
      }
    }

    controllers.run(controller)
  })
})
