import * as _ from 'lodash'
import * as async from 'async'
import * as httpStatus from 'http-status'

import * as utils from './utilities'
import * as stepHelper from './step'

var validKeys = [
  'data',
  'block',
  'done',
  'errorDefaults',
  'errorMapping',
  'onFailure',
  'onFinishStep',
  'onStart',
  'onStartStep',
  'onSuccess',
  'optionsDefaults',
  'optionsMapping',
  'responseMapping',
  'errorSuppress'
]

var requiredKeys = [
  'block'
]

var validBlockKeys = [
  'after',
  'errorDefaults',
  'errorMapping',
  'func',
  'name',
  'sync',
  'value',
  'when',
  'with',
  'withDefaults'
]

var validHandlerKeys = [
  'func',
  'name',
  'with',
  'withDefaults'
]

// Runs a block using common block/controller pattern
function runBlock (config, done) {
  config.data = config.data || {}

  var noop = () => {
  }

  // Set config.done if not provided
  config.done = config.done || done || noop

  // Setup default logging hook mappings
  if (_.isFunction(config.onStart)) {
    config.onStart = {
      func: config.onStart,
      with: ['data']
    }
  }

  if (_.isFunction(config.onSuccess)) {
    config.onSuccess = {
      func: config.onSuccess,
      with: ['response', 'default']
    }
  }

  if (_.isFunction(config.onFailure)) {
    config.onFailure = {
      func: config.onFailure,
      with: ['error', 'default']
    }
  }

  if (_.isFunction(config.onStartStep)) {
    config.onStartStep = {
      func: config.onStartStep,
      with: ['step.name', 'data']
    }
  }

  if (_.isFunction(config.onFinishStep)) {
    config.onFinishStep = {
      func: config.onFinishStep,
      with: ['step.name', 'data', {
        'error': 'error',
        'result': 'result',
        'timer': 'timer'
      }]
    }
  }

  config.onStart = buildLoggingHook(config.onStart, { name: 'onStart' })
  config.onSuccess = buildLoggingHook(config.onSuccess, { name: 'onSuccess' })
  config.onFailure = buildLoggingHook(config.onFailure, { name: 'onFailure' })
  config.onStartStep = buildLoggingHook(config.onStartStep, { name: 'onStartStep' })
  config.onFinishStep = buildLoggingHook(config.onFinishStep, { name: 'onFinishStep' })

  // Lambda will automatically retry if you send the error back
  config.errorSuppress = config.errorSuppress || {'data.retry': false}
  if (_.isString(config.errorSuppress)) {
    config.errorSuppress = [config.errorSuppress]
  }

  validateSettings(config)

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

    validateBlockSettings(step, name)
  })

  var options = {}

  // Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
  if (!config.block.options) {
    options = utils.mappingBlock(config.data, config.optionsMapping, config.optionsDefaults)
    config.block['options'] = {
      name: 'options',
      value: options
    }

    config.options = options
  }

  config.onStart({
    data: config.data,
    options: config.options
  })

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
    config.onFailure({
      data: config.data,
      default: data, // needed for backwards compatibility
      error: error,
      response: data.response,
      results: results,
      options: config.options
    })
  } else {
    config.onSuccess({
      data: config.data,
      default: data, // needed for backwards compatibility
      error: error,
      response: data.response,
      results: results,
      options: config.options
    })
  }

  var done = config.done
  if (done) {
    var suppress = validateWhen(error, config.errorSuppress)
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

function buildLoggingHook (step, defaults) {
  var func = () => {
  }
  var hook = step

  if (hook) {
    hook.name = hook.name || _.get(defaults, 'name', 'hook')
    validateHandlerSettings(hook)

    func = (block) => {
      var args = utils.mappingArgs(block, hook.with, hook.withDefaults)
      hook.func.apply(null, args)
    }
  }

  return func
}

// Run an individual step
function runStep (results, callback, step, config) {
  // Only run this step if all .when values validate. (But don't error; just skip the step if a check fails.)
  var valid = validateWhen(results, step.when)

  if (!valid) {
    return callback()
  }

  // Run the inner function using the wrappers
  runStepFunc(results, callback, step, config)
}

function validateWhen (results, when) {
  return _.every(when, (expected, key) => {
    var path = key
    var inverted = false
    var truthy = false

    // If key is not a string then it is string notation
    if (!_.isString(key)) {
      truthy = true
      path = expected
    }

    if (_.first(path) === '!') {
      inverted = true
      path = path.substring(1)
    }

    var actual = _.get(results, path)
    var success = truthy ? !!actual : actual === expected

    return inverted ? !success : success
  })
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
    onFinish: config.onFinishStep,
    done: callback
  }

  // TODO use event payloads with .value
  if (options.step.value) {
    delete options.onStart
    delete options.onFinish
  }

  stepHelper.run(options)
}

function validateSettings (controller) {
  var keys = _.keys(controller)

  var extra = _.reject(keys, (key) => {
    return _.includes(validKeys, key)
  })

  if (extra.length) {
    throw new Error('Invalid settings: ' + extra.join(', '))
  }

  var missing = _.filter(requiredKeys, (key) => {
    return _.isUndefined(_.get(controller, key))
  })

  if (missing.length) {
    throw new Error('Required settings: ' + missing.join(', '))
  }
}

function validateBlockSettings (step, stepName) {
  var keys = _.keys(step)

  var extra = _.reject(keys, (key) => {
    return _.includes(validBlockKeys, key)
  })

  if (extra.length) {
    extra = _.map(extra, (key) => {
      return `block.${stepName}.${key}`
    })
    throw new Error('Invalid settings: ' + extra.join(', '))
  }

  if ((0 + !!step.func + !!step.value + !!step.sync) !== 1) {
    throw new Error(`Required settings: Must have exactly one of block.${stepName}.func, block.${stepName}.sync or block.${stepName}.value`)
  }
}

function validateHandlerSettings (step) {
  var name = step.name
  var keys = _.keys(step)

  var extra = _.reject(keys, (key) => {
    return _.includes(validHandlerKeys, key)
  })

  if (extra.length) {
    throw new Error('Invalid handler settings: ' + extra.join(', '))
  }

  if (!step.func) {
    throw new Error(`Required settings: Must have .func defined for ${name}.hook`)
  }
}

module.exports = {
  block: buildBlock,
  run: runBlock
}
