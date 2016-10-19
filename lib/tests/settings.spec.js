var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('settings validation', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should not allow invalid root setting', () => {
    var done = sinon.stub()

    var controller = {
      foo: 'bar',
      block: {},
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid settings/)
    expect(done).to.not.be.called
  })

  it('should not allow invalid block setting', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
          foo: 'bar'
        }
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid settings/)
    expect(done).to.not.be.called
  })

  it('should require .block', () => {
    var done = sinon.stub()

    var controller = {
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called
  })

  it('should require block.value or block.func', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called
  })
})
