var _ = require('lodash')
var async = require('async')
var utils = require('./utilities')

function stepOuter (options, callback) {
  var step = options.step
  var dest = _.cloneDeep(options.source) || {}

  dest.start = dest.start || Date.now()

  var func = step.func

  // Only run this step if all .when values validate. (But don't error; just skip the step if a check fails.)
  var valid = utils.validateWhen(dest.results, step.when)
  if (!valid) {
    // TODO add a way to detect skipped steps in hooks
    func = (opts, cb) => cb()
  }

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

  var args = utils.mappingArgs(dest, step.with, step.withDefaults)

  var cb = (err, result) => {
    dest.error = err
    dest.result = result
    dest.stop = Date.now()
    dest.timer = (dest.stop - dest.start) / 1000

    // Don't override the original error object (TODO maybe we should?)
    if (dest.error && (step.errorMapping || step.errorDefaults)) {
      err = utils.mapError(dest, step.errorMapping, step.errorDefaults)
    }

    if (dest.result && (step.responseMapping || step.responseDefaults)) {
      dest.response = utils.mappingBlock(dest, step.responseMapping, step.responseDefaults)
    } else {
      dest.response = null
    }

    if (err && step.errorSuppress && utils.validateWhen(dest, step.errorSuppress)) {
      err = null
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
    step.result = dest && !!dest.result
    step.error = dest && !!dest.error
    step.timer = dest.timer

    if (dest) {
      dest.default = _.clone(dest.data)
      dest.default.error = dest.default.error || err
      dest.default.results = dest.default.results || dest.results
      dest.default.response = dest.default.response || dest.response || null
    }

    if (err && options.onError) {
      stepOuter({
        step: options.onError,
        source: {
          step: step,
          data: dest.data,
          results: dest.results,
          options: dest.options,

          // TODO 2.0 remove these
          default: dest.default,
          result: dest && !!dest.result,
          response: null,
          error: dest && dest.error,
          timer: dest.timer
        }
      })
    }

    if (!err && options.onSuccess) {
      stepOuter({
        step: options.onSuccess,
        source: {
          step: step,
          data: dest.data,
          results: dest.results,
          response: dest.response,
          options: dest.options,

          // TODO 2.0 remove these
          default: dest.default,
          result: dest && !!dest.result,
          error: dest && !!dest.error,
          timer: dest.timer
        }
      })
    }

    if (options.onFinish) {
      stepOuter({
        step: options.onFinish,
        source: {
          step: step,
          data: dest.data,
          default: dest.default, // TODO 2.0 needed for backwards compatibility
          results: dest.results,
          response: dest.response,
          options: dest.options,

          // TODO 2.0 remove these
          result: dest && !!dest.result,
          error: dest && !!dest.error,
          timer: dest.timer
        }
      })
    }

    callback(err, dest && dest.response)
  })
}

module.exports = {
  run: run,
  stepOuter: stepOuter
}
