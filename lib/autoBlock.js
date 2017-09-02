import * as _ from 'lodash'
import * as async from 'async'
import * as httpStatus from 'http-status'

import * as utils from './utilities'
import * as stepHelper from './step'
import * as validate from './validate'

// Runs a block using common block/controller pattern
function runBlock (config, done) {
  config.data = config.data || {}

  var noop = () => {
  }

  // Set config.done if not provided
  config.done = config.done || done || noop

  // Setup default logging hook mappings
  // TODO 2.0 make these defaults less weird
  buildLoggingHook(config, 'onStart', { with: ['data'] })
  buildLoggingHook(config, 'onSuccess', { with: ['response', 'default'] })
  buildLoggingHook(config, 'onFailure', { with: ['error', 'default'] })

  buildLoggingHook(config, 'onStartStep', { with: ['step.name', 'data'] })
  buildLoggingHook(config, 'onFinishStep', {
    with: ['step.name', 'data', {
      'error': 'step.error',
      'result': 'step.result',
      'timer': 'step.timer'
    }]
  })

  // Lambda will automatically retry if you send the error back
  config.errorSuppress = config.errorSuppress || {'data.retry': false}
  if (_.isString(config.errorSuppress)) {
    config.errorSuppress = [config.errorSuppress]
  }

  validate.settings(config)

  var options = {}

  // Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
  if (!config.block.options) {
    options = utils.mappingBlock(config.data, config.optionsMapping, config.optionsDefaults)
    config.block['options'] = {
      value: options
    }

    config.options = options
  }

  _.forOwn(config.block, (step, name) => {
    // If no name was provided, use the key. This is used during logging.
    step.name = step.name || name

    step.after = step.after || []
    if (_.isString(step.after)) {
      step.after = [step.after]
    }

    step.when = step.when || []
    if (_.isString(step.when)) {
      step.when = [step.when]
    }

    step.with = step.with || {}
    if (_.isString(step.with)) {
      step.with = [step.with]
    }

    validate.blockSettings(step, name)
  })

  if (config.onStart) {
    stepHelper.stepOuter({
      step: config.onStart,
      source: {
        data: config.data,
        options: config.options
      }
    })
  }

  var autoBlock = buildBlock(config.block, config)
  var autoCb = (error, results) => finish(error, results, config)
  try {
    async.auto(autoBlock, autoCb)
  } catch (e) {
    autoCb(e)
  }
}

// Resolve the error and results
function finish (error, results, config) {
  var data = utils.resultBlock(config, error, results)

  // Map response if desired; can access raw error object
  if (config.responseMapping) {
    data.response = utils.mappingBlock(data, config.responseMapping)
  }

  // Map error if desired; can access response object
  if (error && !error.requestId && (config.errorMapping || config.errorDefaults)) {
    error = utils.mapError(data, config.errorMapping, config.errorDefaults)
  }

  var status = _.get(error, 'data.status')
  if (error && error.message && status) {
    error.message = (httpStatus[status] || status) + `: ${error.message}`
  }

  if (error) {
    if (config.onFailure) {
      stepHelper.stepOuter({
        step: config.onFailure,
        source: {
          data: config.data,
          default: data, // needed for backwards compatibility
          error: error,
          response: data.response,
          results: results,
          options: config.options
        }
      })
    }
  } else {
    if (config.onSuccess) {
      stepHelper.stepOuter({
        step: config.onSuccess,
        source: {
          data: config.data,
          default: data, // needed for backwards compatibility
          error: error,
          response: data.response,
          results: results,
          options: config.options
        }
      })
    }
  }

  var done = config.done
  if (done) {
    var suppress = utils.validateWhen(error, config.errorSuppress)
    if (suppress) {
      error = null
    }
    process.nextTick(() => done(error, data.response))
  }
}

// Build out an async.auto block using our special notation
function buildBlock (block, config) {
  var autoBlock = _.transform(block, (asyncBlock, step, key) => {
    asyncBlock[key] = buildStep(step, config)
  }, {})

  return autoBlock
}

function buildStep (step, config) {
  // Figure out which steps need to come before this one
  // - anything in .after
  // - the first path segement in each .with
  // - the first path segement in each .when
  var deps = []

  var withDeps = _.map(step.with, (value) => _.first(_.split(value, '.')))

  var whenDeps = _.map(step.when, (value, key) => {
    var dep = _.isString(key) ? key : value
    dep = _.first(_.split(dep, '.'))
    if (_.first(dep) === '!') {
      return dep.substring(1)
    }

    return dep
  })

  deps = _.union(step.after, withDeps, whenDeps)

  // Build the async callback. This takes two forms: If no dependencies, no results paramater is included.
  var asyncFunc
  if (deps.length) {
    asyncFunc = (results, cb) => runStep(results, cb, step, config)
  } else {
    asyncFunc = (cb) => runStep(null, cb, step, config)
  }

  // async.auto takes the callback as the final element in the depedencies array
  deps.push(asyncFunc)

  return deps
}

function buildLoggingHook (config, path, defaults) {
  if (config[path]) {
    if (_.isFunction(config[path])) {
      config[path] = {
        func: config[path],
        with: defaults.with
      }
    }

    config[path].name = config[path].name || _.get(defaults, 'name', path)
    validate.handlerSettings(config[path])
  }
}

// Run an individual step
function runStep (results, callback, step, config) {
  // Only run this step if all .when values validate. (But don't error; just skip the step if a check fails.)
  var valid = utils.validateWhen(results, step.when)

  if (!valid) {
    return callback()
  }

  // Run the inner function using the wrappers
  runStepFunc(results, callback, step, config)
}

// Log and run the step with logging
// TODO 2.0 cleanup these weird mapping rules
function runStepFunc (results, callback, step, config) {
  var fixed = _.clone(step)
  if (_.isArray(step.with)) {
    fixed.with = _.map(step.with, (value) => `results.${value}`)
  } else {
    fixed.with = _.mapValues(step.with, (value) => `results.${value}`)
  }
  fixed.errorMapping = _.mapValues(step.errorMapping, (value) => {
    if (_.startsWith(value, 'error')) {
      return value
    }
    if (_.startsWith(value, 'results')) {
      return value
    }
    return `data.${value}`
  })

  var options = {
    step: fixed,
    source: {
      data: config.data,
      options: config.options,
      results: results,
      step: {
        name: step.name
      }
    },
    onStart: config.onStartStep,
    onFinish: config.onFinishStep
  }

  // TODO use event payloads with .value
  if (options.step.value) {
    delete options.onStart
    delete options.onFinish
  }

  stepHelper.run(options, callback)
}

module.exports = {
  block: buildBlock,
  run: runBlock
}
