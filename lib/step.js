var _ = require('lodash')
var async = require('async')
var utils = require('./utilities')

function stepOuter (options, callback) {
  var step = options.step
  var source = _.cloneDeep(options.source)

  var func = step.func

  // .value simply returns
  if (!func && step.value) {
    func = (opts, cb) => {
      cb(null, step.value)
    }
  }

  // TODO use async-done
  if (!func && step.sync) {
    func = async.asyncify(step.sync)
  }

  source.start = source.start || Date.now()

  var args = utils.mappingArgs(source, step.with, step.withDefaults)

  var cb = (err, result) => {
    var dest = _.cloneDeep(source)
    dest.error = err
    dest.result = result
    dest.stop = Date.now()
    dest.timer = (dest.stop - dest.start) / 1000

    if (dest.error && (step.errorMapping || step.errorDefaults)) {
      err = utils.mapError(dest, step.errorMapping, step.errorDefaults)
    }

    if (callback) {
      callback(err, dest)
    }
  }
  args.push(cb)

  try {
    func.apply(null, args)
  } catch (e) {
    cb(e)
  }
}

function run (options, callback) {
  options = options || {}

  var step = options.step

  // TODO kind of hacky not sending callback
  if (options.onStart) {
    stepOuter({
      step: options.onStart,
      source: options.source
    })
  }

  stepOuter({
    step: step,
    source: options.source
  }, (err, dest) => {
    // TODO add onError event

    step.result = dest && !!dest.result
    step.error = dest && !!dest.error
    step.timer = dest.timer

    if (options.onFinish) {
      stepOuter({
        step: options.onFinish,
        source: {
          step: step,
          data: dest.data,
          results: dest.results,
          options: dest.options,

          // TODO 2.0 remove these
          result: dest && !!dest.result,
          error: dest && !!dest.error,
          timer: dest.timer
        }
      })
    }

    callback(err, dest && dest.result)
  })
}

module.exports = {
  run: run,
  stepOuter: stepOuter
}
