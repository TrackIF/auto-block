var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
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
    expect(done).to.not.be.called()
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
    expect(done).to.not.be.called()
  })

  it('should require .block', () => {
    var done = sinon.stub()

    var controller = {
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called()
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
    expect(done).to.not.be.called()
  })

  it('should not allow block.value and block.func', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
          value: 'a',
          func: (options, cb) => cb(null, options)
        }
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow block.value and block.sync', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
          value: 'a',
          sync: (options) => options
        }
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow block.func and block.sync', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
          func: (options, cb) => cb(null, options),
          sync: (options) => options
        }
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow invalid .onStart settings', () => {
    var logging = sinon.stub()
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onStart: {
        func: logging,
        foo: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid handler settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow invalid .onSuccess settings', () => {
    var logging = sinon.stub()
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onSuccess: {
        func: logging,
        foo: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid handler settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow invalid .onFailure settings', () => {
    var logging = sinon.stub()
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onFailure: {
        func: logging,
        foo: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid handler settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow invalid .onStartStep settings', () => {
    var logging = sinon.stub()
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onStartStep: {
        func: logging,
        foo: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid handler settings/)
    expect(done).to.not.be.called()
  })

  it('should not allow invalid .onFinishStep settings', () => {
    var logging = sinon.stub()
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onFinishStep: {
        func: logging,
        foo: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Invalid handler settings/)
    expect(done).to.not.be.called()
  })

  it('should require .func setting for .onFinishStep', () => {
    var done = sinon.stub()

    var controller = {
      block: {
        'one': {
        }
      },
      onFinishStep: {
        name: 'bar'
      },
      done: done
    }

    expect(() => {
      controllers.run(controller)
    }).to.throw(/Required settings.*bar/)
    expect(done).to.not.be.called()
  })
})
