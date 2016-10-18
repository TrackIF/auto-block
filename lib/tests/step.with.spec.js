var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .with', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('object notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'alpha')
    var two = sinon.stub().callsArgWith(1, null, {'beta': 'delta'})

    var three = (results, cb) => {
      expect(results).to.have.properties({
        a: 'alpha',
        b: {
          c: 'delta'
        }
      })

      cb()
    }

    var final = (err, response) => {
      expect(err).to.not.exist
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
      },
      'three': {
        func: three,
        with: {
          'a': 'one',
          'b.c': 'two.beta'
        }
      }
    }

    controllers.run(controller)
  })

  it('array notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'alpha')
    var two = sinon.stub().callsArgWith(1, null, {'beta': 'delta'})

    var three = (a, b, cb) => {
      expect(a).to.eql('alpha')
      expect(b).to.eql('delta')

      cb()
    }

    var final = (err, response) => {
      expect(err).to.not.exist
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
      },
      'three': {
        func: three,
        with: ['one', 'two.beta']
      }
    }

    controllers.run(controller)
  })

  it('missing', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'alpha')
    var two = sinon.stub().callsArgWith(1, null, {'beta': 'delta'})

    var three = (results, cb) => {
      expect(results).to.have.properties({
        a: 'alpha',
        b: {
          c: 'delta'
        }
      })

      cb()
    }

    var final = (err, response) => {
      expect(err).to.not.exist
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
      },
      'three': {
        func: three,
        with: {
          'a': 'one',
          'b.c': 'two.beta'
        }
      }
    }

    controllers.run(controller)
  })
})
