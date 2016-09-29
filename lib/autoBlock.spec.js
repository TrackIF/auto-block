var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect
chai.use(require('sinon-chai'))
chai.use(require('chai-properties'))

var controllers = require('./autoBlock')

describe('autoBlock.js', () => {
  var sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('settings validation', () => {
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

  describe('controller options', () => {
    describe('.done', () => {
      it('called', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var final = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

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
          }
        }

        controllers.run(controller)
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
          }
        }

        controllers.run(controller)
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
          }
        }

        controllers.run(controller, other)
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          }
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controllers.run(controller, final)
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          errorMapping: {
            'foo': 'results.one'
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          errorMapping: {
            'error': 'error'
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
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'bar'
          })

          done()
        }

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          errorMapping: {
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

    describe('.optionsMapping', () => {
      it('should support object notation (data)', (done) => {
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          optionsMapping: {
            'foo': 'event.foo'
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

    describe('.responseMapping', () => {
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

        controllers.run(controller)
      })

      it('should survive invalid dependency', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')

        var final = (err, response) => {
          expect(err).to.exist
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
            func: one,
            after: ['two']
          }
        }

        controllers.run(controller)
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
            func: two,
            when: 'one.alpha'
          }
        }

        controllers.run(controller)
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
            func: two,
            when: 'one.alpha'
          }
        }

        controllers.run(controller)
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
            func: two,
            when: '!one.alpha'
          }
        }

        controllers.run(controller)
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
            func: two,
            when: '!one.alpha'
          }
        }

        controllers.run(controller)
      })

      it('object notation (success)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 'beta'})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.be.called

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
            func: two,
            when: {
              'one.alpha': 'beta'
            }
          }
        }

        controllers.run(controller)
      })

      it('object notation (skipped)', (done) => {
        var one = sinon.stub().callsArgWith(1, null, {'alpha': 0})
        var two = sinon.stub().callsArgWith(1, null, 'delta')

        var final = (err, response) => {
          expect(err).to.not.exist

          expect(one).to.be.called
          expect(two).to.not.be.called

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
            func: two,
            when: {
              'one.alpha': 'delta'
            }
          }
        }

        controllers.run(controller)
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
            when: ['one.alpha', 'two']
          }
        }

        controllers.run(controller)
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
            when: ['one.alpha', 'two']
          }
        }

        controllers.run(controller)
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
            when: ['one.alpha', '!two']
          }
        }

        controllers.run(controller)
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
            when: ['one.alpha', '!two']
          }
        }

        controllers.run(controller)
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

        var controller = {
          data: {
            event: { foo: 'bar' }
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          done: final
        }

        controller.block = {
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

        controllers.run(controller)
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
            func: two,
            after: ['one'],
            errorMapping: {
              'foo': 'results.one'
            }
          }
        }

        controllers.run(controller)
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

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          done: final
        }

        controller.block = {
          'one': {
            func: one,
            errorMapping: {
              'error': 'error'
            }
          }
        }

        controllers.run(controller)
      })

      it('should support object notation (data)', (done) => {
        var one = (results, cb) => {
          cb(new Error('Sample error'))
        }

        var final = (err, response) => {
          expect(err.data).to.have.properties({
            foo: 'bar'
          })

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
            func: one,
            errorMapping: {
              'foo': 'event.foo'
            }
          }
        }

        controllers.run(controller)
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

        controllers.run(controller)
      })
    })
  })

  describe('logging hooks', () => {
    describe('.onStart', () => {
      it('called once', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          onStart: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledOnce
          expect(logging.args[0]).to.have.properties([
            {
              event: controller.data.event
            }
          ])

          done()
        }

        controllers.run(controller)
      })
    })

    describe('.onSuccess', () => {
      it('called once', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          responseMapping: 'results.two',
          onSuccess: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.exist

          expect(logging).to.be.calledOnce
          expect(logging.args[0]).to.have.properties([
            'two',
            {
              event: controller.data.event,
              response: 'two',
              error: null,
              results: {
                'one': 'one',
                'two': 'two'
              }
            }
          ])

          done()
        }

        controllers.run(controller)
      })

      it('not called if error', (done) => {
        var sampleError = new Error('sample error')
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, sampleError, null)

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          responseMapping: 'results.two',
          onSuccess: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.exist
          expect(response).to.not.exist

          expect(logging).to.not.be.called

          done()
        }

        controllers.run(controller)
      })
    })

    describe('.onFailure', () => {
      it('not called if success', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          responseMapping: 'results.two',
          onFailure: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.exist

          expect(logging).to.not.be.called

          done()
        }

        controllers.run(controller)
      })

      it('called once if error', (done) => {
        var sampleError = new Error('sample error')
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, sampleError, null)

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          responseMapping: 'results.two',
          onFailure: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledOnce
          expect(logging.args[0]).to.have.properties([
            sampleError,
            {
              event: controller.data.event,
              response: null,
              error: sampleError,
              results: {
                'one': 'one',
                'two': null
              }
            }
          ])

          done()
        }

        controllers.run(controller)
      })
    })

    describe('.onStartStep', () => {
      it('called once per step', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          onStartStep: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledTwice
          expect(logging).to.be.calledWith('one', controller.data)
          expect(logging).to.be.calledWith('two', controller.data)

          done()
        }

        controllers.run(controller)
      })
    })

    describe('.finishStep', () => {
      it('called once per step', (done) => {
        var one = sinon.stub().callsArgWith(1, null, 'one')
        var two = sinon.stub().callsArgWith(1, null, 'two')

        var logging = sinon.stub()

        var controller = {
          data: {
            event: { foo: 'bar' }
          },
          onFinishStep: logging
        }

        controller.block = {
          'one': {
            func: one
          },
          'two': {
            func: two
          }
        }

        controller.done = (err, response) => {
          expect(err).to.not.exist
          expect(response).to.not.exist

          expect(logging).to.be.calledTwice

          expect(logging).to.be.calledWith('one', controller.data)
          expect(logging).to.be.calledWith('two', controller.data)

          var actual = logging.args[0][2]
          expect(actual).to.have.properties({
            error: false,
            result: true
          })
          expect(actual).to.have.property('timer')

          actual = logging.args[1][2]
          expect(actual).to.have.properties({
            error: false,
            result: true
          })
          expect(actual).to.have.property('timer')

          done()
        }

        controllers.run(controller)
      })
    })
  })
})
