var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .when', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  var testcases = [
    {
      name: 'string notation (success)',
      one: {'alpha': 'beta'},
      called: 1,
      when: 'one.alpha'
    },
    {
      name: 'string notation (skipped)',
      one: {'alpha': 0},
      called: 0,
      when: 'one.alpha'
    },
    {
      name: 'string inverted notation (success)',
      one: {'alpha': 0},
      called: 1,
      when: '!one.alpha'
    },
    {
      name: 'string inverted notation (skipped)',
      one: {'alpha': 'beta'},
      called: 0,
      when: '!one.alpha'
    },
    {
      name: 'object notation (success)',
      one: {'alpha': 'beta'},
      called: 1,
      when: {'one.alpha': 'beta'}
    },
    {
      name: 'object notation (skipped)',
      one: {'alpha': 'delta'},
      called: 0,
      when: {'one.alpha': 'beta'}
    },
    {
      name: 'object inverted notation (success)',
      one: {'alpha': 'delta'},
      called: 1,
      when: {'!one.alpha': 'beta'}
    },
    {
      name: 'object inverted notation (skipped)',
      one: {'alpha': 'beta'},
      called: 0,
      when: {'!one.alpha': 'beta'}
    },
    {
      name: 'array notation (success)',
      one: {'alpha': 'beta'},
      two: 'epsilon',
      called: 1,
      when: ['one.alpha', 'two']
    },
    {
      name: 'array notation (skipped)',
      one: {'alpha': ''},
      two: 'epsilon',
      called: 0,
      when: ['one.alpha', 'two']
    },
    {
      name: 'array inverted notation (success)',
      one: {'alpha': ''},
      two: 'epsilon',
      called: 1,
      when: ['!one.alpha', 'two']
    },
    {
      name: 'array inverted notation (skipped)',
      one: {'alpha': 'beta'},
      two: 'epsilon',
      called: 0,
      when: ['!one.alpha', 'two']
    }
  ]

  testcases.forEach((testcase) => {
    it(testcase.name, (done) => {
      var one = sinon.stub().callsArgWith(1, null, testcase.one)
      var two = sinon.stub().callsArgWith(1, null, testcase.two)
      var three = sinon.stub().callsArgWith(1, null, 'delta')

      var final = (err, response) => {
        expect(err).to.not.exist

        expect(one).to.be.called
        expect(two).to.have.callCount(testcase.two ? 1 : 0)
        expect(three).to.have.callCount(testcase.called)

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
        'three': {
          func: three,
          when: testcase.when
        }
      }

      if (testcase.two) {
        controller.block.two = {
          func: two
        }
      }

      controllers.run(controller)
    })
  })
})
