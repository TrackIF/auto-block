var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('controller .errorDefaults', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should support object notation', (done) => {
    var one = sinon.stub().callsArgWith(1, null, 'one')
    var two = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        foo: 'one',
        bar: 'beta'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      errorMapping: {
        'foo': 'results.one'
      },
      errorDefaults: {
        'foo': 'alpha',
        'bar': 'beta'
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
      }
    }

    controllers.run(controller)
  })

  it('should support nested paths', (done) => {
    var one = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        'foo': {
          'bar': 'alpha'
        }
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      errorMapping: {
        'foo.bar': 'results.three'
      },
      errorDefaults: {
        'foo.bar': 'alpha'
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

  it('should not override step level error', (done) => {
    var two = sinon.stub().callsArgWith(1, null, 'two')
    var four = sinon.stub().callsArgWith(1, null, 'four')
    var five = (results, cb) => {
      cb(new Error('Sample error'))
    }

    var final = (err, response) => {
      expect(err.data).to.have.properties({
        'controller-mapping': 'two',
        'controller-defaults': 'one',
        'controller-both': 'two',
        'step-mapping': 'four',
        'step-defaults': 'three',
        'step-both': 'four',
        'both-defaults': 'three',
        'both-mapping': 'two',
        'all': 'two'
      })

      done()
    }

    var controller = {
      data: {
        event: { foo: 'bar' }
      },
      errorDefaults: {
        'controller-defaults': 'one',
        'controller-both': 'one',
        'both-defaults': 'one',
        'all': 'one'
      },
      errorMapping: {
        'controller-mapping': 'results.two',
        'controller-both': 'results.two',
        'both-mapping': 'results.two',
        'all': 'results.two'
      },
      done: final
    }

    controller.block = {
      'two': {
        func: two
      },
      'four': {
        func: four
      },
      'five': {
        func: five,
        after: ['two', 'four'],
        errorDefaults: {
          'step-defaults': 'three',
          'step-both': 'three',
          'both-defaults': 'three',
          'all': 'three'
        },
        errorMapping: {
          'step-mapping': 'results.four',
          'step-both': 'results.four',
          'both-mapping': 'results.four',
          'all': 'results.four'
        }
      }
    }

    controllers.run(controller)
  })
})
