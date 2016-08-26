var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('./autoBlock')
// var logging = require('./logging')

describe('autoBlock.js', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  // sandbox.stub(logging, 'info') // TODO need an env flag for console levels
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handler options', () => {
    describe('.done', () => {
      it('called', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          done: final
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
      })

      it('called with error', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err).to.exist
          expect(response).to.not.exist

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          done: final
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
      })

      it('overrides context.done', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var other = sinon.stub()

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(other).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: other
          },
          done: final
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
      })

      it('falls back to context.done', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var other = sinon.stub()

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(other).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
      })

      it('prefers context.done over parameter', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var other = sinon.stub()

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(other).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler, other)
      })

      it('overrides parameter', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var other = sinon.stub()

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(other).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          done: final
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler, other)
      })

      it('falls back to parameter', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var other = sinon.stub()

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(other).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler, final)
      })
    })

    describe('.errorMapping', () => {
      it('should support object notation (results)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'one'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorMapping: {
            'foo': 'results.one'
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            after: ['one']
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (error)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err).to.have.properties({
            message: 'Sample error'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorMapping: {
            'error': 'error'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (event)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'bar'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorMapping: {
            'foo': 'event.foo'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (context)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'demo'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorMapping: {
            'foo': 'context.functionName'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })
    })

    describe('.errorDefaults', () => {
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorMapping: {
            'foo': 'results.one'
          },
          errorDefaults: {
            'foo': 'alpha',
            'bar': 'beta'
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            after: ['one']
          }
        }

        controllers.run(handler)
      })

      it('should not override step level error', (done) => {
        var two = sinon.stub().callsArgWith(1, null, 'two')
        var four = sinon.stub().callsArgWith(1, null, 'four')
        var five = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            'handler-mapping': 'two',
            'handler-defaults': 'one',
            'handler-both': 'two',
            'step-mapping': 'four',
            'step-defaults': 'three',
            'step-both': 'four',
            'both-defaults': 'three',
            'both-mapping': 'two',
            'all': 'two'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          errorDefaults: {
            'handler-defaults': 'one',
            'handler-both': 'one',
            'both-defaults': 'one',
            'all': 'one'
          },
          errorMapping: {
            'handler-mapping': 'results.two',
            'handler-both': 'results.two',
            'both-mapping': 'results.two',
            'all': 'results.two'
          }
        }

        handler.block = {
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

        controllers.run(handler)
      })
    })

    describe('.optionsMapping', () => {
      it('should support object notation (event)', (done) => {
        var one = (options, callback) => {
          expect(options).to.have.properties({
            'foo': 'bar'
          })
          callback(null, 'one')
        }

        var final = (err, response) => {
          expect(err).to.not.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          optionsMapping: {
            'foo': 'event.foo'
          }
        }

        handler.block = {
          'one': {
            func: one,
            with: {
              'foo': 'options.foo'
            }
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (context)', (done) => {
        var one = (options, callback) => {
          expect(options).to.have.properties({
            'foo': 'demo'
          })
          callback(null, 'one')
        }

        var final = (err, response) => {
          expect(err).to.not.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          optionsMapping: {
            'foo': 'context.functionName'
          }
        }

        handler.block = {
          'one': {
            func: one,
            with: {
              'foo': 'options.foo'
            }
          }
        }

        controllers.run(handler)
      })
    })

    describe('.optionsDefaults', () => {
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          optionsMapping: {
            'foo': 'event.foo'
          },
          optionsDefaults: {
            'foo': 'zaz',
            'alpha': 'beta'
          }
        }

        handler.block = {
          'one': {
            func: one,
            with: {
              'foo': 'options.foo',
              'alpha': 'options.alpha'
            }
          }
        }

        controllers.run(handler)
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          optionsMapping: {
            'foo': 'event.foo'
          },
          optionsDefaults: {
            'foo': 'zaz',
            'alpha': 'beta'
          }
        }

        handler.block = {
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

        controllers.run(handler)
      })
    })

    describe('.responseMapping', () => {
      it('should support string notation (results)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, {'two': 'three'})

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.eql('three')

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          responseMapping: 'results.two.two'
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          responseMapping: {
            'foo': 'results.one',
            'bar.zaz': 'results.two.two'
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(handler)
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          responseMapping: {
            'foo': 'error'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (event)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.have.properties({
            'foo': 'bar'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          responseMapping: {
            'foo': 'event.foo'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (context)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.have.properties({
            'foo': 'demo'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          },
          responseMapping: {
            'foo': 'context.functionName'
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })
    })
  })

  describe('step options', () => {
    describe('.after', () => {
      it('should support array notation', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')
        var three = sinon.stub().callsArgWith(1, null, 'three')

        var four = (results, cb) => {
          expect(one).to.be.called
          expect(two).to.be.called
          expect(three).to.not.be.called
          cb()
        }

        var final = (err, response) => {
          expect(err).to.not.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            after: ['one']
          },
          'three': {
            func: three,
            after: ['four']
          },
          'four': {
            func: four,
            after: ['two']
          }
        }

        controllers.run(handler)
      })

      it('should survive invalid dependency', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')

        var final = (err, response) => {
          expect(err).to.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one,
            after: ['two']
          }
        }

        controllers.run(handler)
      })
    })

    describe('.with', () => {
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
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

        controllers.run(handler)
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
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

        controllers.run(handler)
      })
    })

    describe('.when', () => {
      it('string notation (success)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            when: 'one.alpha'
          }
        }

        controllers.run(handler)
      })

      it('string notation (skipped)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 0})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            when: 'one.alpha'
          }
        }

        controllers.run(handler)
      })

      it('string inverted notation (success)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            when: '!one.alpha'
          }
        }

        controllers.run(handler)
      })

      it('string inverted notation (skipped)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 0})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            when: '!one.alpha'
          }
        }

        controllers.run(handler)
      })

      it('array notation (success)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, 'delta')
        var three = sinon.stub().callsArgWith(1, null, 'epsilon')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called
          expect(three).to.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          },
          'three': {
            func: three,
            when: ['one.alpha', 'two']
          }
        }

        controllers.run(handler)
      })

      it('array notation (skipped)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, '')
        var three = sinon.stub().callsArgWith(1, null, 'epsilon')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called
          expect(three).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          },
          'three': {
            func: three,
            when: ['one.alpha', 'two']
          }
        }

        controllers.run(handler)
      })

      it('array inverted notation (success)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, 'delta')
        var three = sinon.stub().callsArgWith(1, null, 'epsilon')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called
          expect(three).to.not.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          },
          'three': {
            func: three,
            when: ['one.alpha', '!two']
          }
        }

        controllers.run(handler)
      })

      it('array inverted notation (skipped)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, '')
        var three = sinon.stub().callsArgWith(1, null, 'epsilon')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called
          expect(three).to.be.called

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          },
          'three': {
            func: three,
            when: ['one.alpha', '!two']
          }
        }

        controllers.run(handler)
      })
    })

    describe('.func', () => {
      it('should survive throw', (done) => {
        var one = (results, cb) => {
          throw new Error('HES DEAD JIM')
        }

        var final = (err, response) => {
          expect(err).to.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          }
        }

        controllers.run(handler)
      })
    })

    describe('.value', () => {
      it('object notation', (done) => {
        var two = (results, cb) => {
          expect(results).to.have.properties({
            a: 'beta'
          })

          cb()
        }

        var final = (err, response) => {
          expect(err).to.not.exist
          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            value: {
              'alpha': 'beta'
            }
          },
          'two': {
            func: two,
            with: {
              'a': 'one.alpha'
            }
          }
        }

        controllers.run(handler)
      })
    })

    describe('.errorMapping', () => {
      it('should support object notation (results)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'one'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            after: ['one'],
            errorMapping: {
              'foo': 'results.one'
            }
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (error)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err).to.have.properties({
            message: 'Sample error'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one,
            errorMapping: {
              'error': 'error'
            }
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (event)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'bar'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one,
            errorMapping: {
              'foo': 'event.foo'
            }
          }
        }

        controllers.run(handler)
      })

      it('should support object notation (context)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'demo'
          })

          done()
        }

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one,
            errorMapping: {
              'foo': 'context.functionName'
            }
          }
        }

        controllers.run(handler)
      })
    })

    describe('.errorDefaults', () => {
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

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo',
            done: final
          }
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two,
            after: ['one'],
            errorMapping: {
              'foo': 'results.one'
            },
            errorDefaults: {
              'foo': 'alpha',
              'bar': 'beta'
            }
          }
        }

        controllers.run(handler)
      })
    })
  })

  describe('logging hooks', () => {
    describe('.start', () => {
      it('called once', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          start: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledOnce
          expect(logging).to.be.calledWith(handler.event, handler.context)

          done()
        }

        controllers.run(handler)
      })
    })

    describe('.success', () => {
      it('called once', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          responseMapping: 'results.two',
          success: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.exist

          expect(logging).to.be.calledOnce
          expect(logging).to.be.calledWith('two', handler.context)

          done()
        }

        controllers.run(handler)
      })

      it('not called if error', (done) => {
        var sampleError = new Error('sample error')
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, sampleError, null)

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          responseMapping: 'results.two',
          success: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.exist
          expect(response).to.not.exist

          expect(logging).to.not.be.called

          done()
        }

        controllers.run(handler)
      })
    })

    describe('.failure', () => {
      it('not called if success', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          responseMapping: 'results.two',
          failure: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.exist

          expect(logging).to.not.be.called

          done()
        }

        controllers.run(handler)
      })

      it('called once if error', (done) => {
        var sampleError = new Error('sample error')
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, sampleError, null)

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          responseMapping: 'results.two',
          failure: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledOnce
          expect(logging).to.be.calledWith(sampleError, handler.context)

          done()
        }

        controllers.run(handler)
      })
    })

    describe('.startStep', () => {
      it('called once per step', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          startStep: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledTwice
          expect(logging).to.be.calledWith('one', handler.context)
          expect(logging).to.be.calledWith('two', handler.context)

          done()
        }

        controllers.run(handler)
      })
    })

    describe('.finishStep', () => {
      it('called once per step', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var handler = {
          event: { foo: 'bar' },
          context: {
            functionName: 'demo'
          },
          finishStep: logging
        }

        handler.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        handler.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledTwice

          expect(logging).to.be.calledWith('one', handler.context)
          expect(logging).to.be.calledWith('two', handler.context)

          var actual = JSON.parse(logging.args[0][2])
          expect(actual).to.have.properties({
            error: false,
            result: true
          })
          expect(actual).to.have.property('timer')

          actual = JSON.parse(logging.args[1][2])
          expect(actual).to.have.properties({
            error: false,
            result: true
          })
          expect(actual).to.have.property('timer')

          done()
        }

        controllers.run(handler)
      })
    })
  })
})
