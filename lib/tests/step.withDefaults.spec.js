var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('dirty-chai'))
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('../autoBlock')

describe('step .withDefaults', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  var testcases = [
    {
      name: 'should fallback to defaults',
      one: 'alpha',
      two: {'delta': 'beta'},
      with: {
        'a': 'one',
        'b.c': 'two.beta'
      },
      withDefaults: {
        'b.c': 'gamma'
      },
      response: {
        a: 'alpha',
        b: {
          c: 'gamma'
        }
      }
    },
    {
      name: 'should not override existing',
      one: 'alpha',
      two: {'beta': 'delta'},
      with: {
        'a': 'one',
        'b.c': 'two.beta'
      },
      withDefaults: {
        'b.c': 'gamma'
      },
      response: {
        a: 'alpha',
        b: {
          c: 'delta'
        }
      }
    },
    {
      name: 'should error if .with uses array notation',
      one: 'alpha',
      with: ['one'],
      withDefaults: {
        'b.c': 'gamma'
      },
      error: true
    }
  ]

  testcases.forEach((testcase) => {
    it(testcase.name, (done) => {
      var one = sinon.stub().callsArgWith(1, null, testcase.one)
      var two = sinon.stub().callsArgWith(1, null, testcase.two)

      var three = (options, cb) => {
        cb(null, options)
      }

      var final = (err, response) => {
        if (testcase.error) {
          expect(err).to.exist()
        } else {
          expect(err).to.not.exist()
          expect(response).to.eql(testcase.response)
        }
        done()
      }

      var controller = {
        data: {
          event: { foo: 'bar' }
        },
        responseMapping: 'results.three',
        done: final
      }

      controller.block = {
        'one': {
          func: one
        },
        'three': {
          func: three,
          with: testcase.with,
          withDefaults: testcase.withDefaults
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
