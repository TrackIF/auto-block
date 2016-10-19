import * as _ from 'lodash'
import * as async from 'async'
import * as httpStatus from 'http-status'

import * as utils from './utilities'

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
  'responseMapping'
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
  'value',
  'when',
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

  // Setup noop logging hooks
  config.onStart = config.onStart || noop
  config.onSuccess = config.onSuccess || noop
  config.onFailure = config.onFailure || noop
  config.onStartStep = config.onStartStep || noop
  config.onFinishStep = config.onFinishStep || noop

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

  config.onStart(config.data)

  // Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
  if (!config.block.options) {
    var options = utils.mappingBlock(config.data, config.optionsMapping, config.optionsDefaults)
    config.block['options'] = {
      value: options
    }
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
    config.onFailure(error, data)
  } else {
    config.onSuccess(data.response, data)
  }

  var done = config.done
  if (done) {
    // Lambda will automatically retry if you send the error back
    if (!_.get(error, 'data.retry', true)) {
      error = null
    }
    process.nextTick(() => done(error, data.response))
  }
}

// Build out an async.auto block using our special notation
function buildBlock (block, config) {
  var autoBlock = _.transform(block, (asyncBlock, step, key) => {
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

    asyncBlock[key] = deps
  }, {})

  return autoBlock
}

// Run an individual step
function runStep (results, callback, step, config) {
  // .value simply returns
  if (step.value) {
    return callback(null, step.value)
  }

  // Only run this step if all .when values validate. (But don't error; just skip the step if a check fails.)
  var valid = runStepWhen(results, step.when)

  if (!valid) {
    return callback()
  }

  // Run the inner function using the wrappers
  runStepFunc(results, callback, step, config)
}

function runStepWhen (results, when) {
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
function runStepFunc (results, callback, step, config) {
  var func = step.func
  var start = Date.now()

  config.onStartStep(step.name, config.data)

  var args = utils.mappingArgs(results, step.with, step.withDefaults)

  var cb = (err, result) => {
    var stepOutput = {
      error: !!err,
      result: !!result,
      timer: (Date.now() - start) / 1000
    }
    config.onFinishStep(step.name, config.data, stepOutput)

    if (err && (step.errorMapping || step.errorDefaults)) {
      var errorOptions = utils.resultBlock(config, err, results)
      err = utils.mapError(errorOptions, step.errorMapping, step.errorDefaults)
    }

    callback(err, result)
  }
  args.push(cb)

  try {
    func.apply(null, args)
  } catch (e) {
    cb(e)
  }
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

  if (!step.func && !step.value) {
    throw new Error(`Required settings: Must have either block.${stepName}.func or block.${stepName}.value`)
  }
}

module.exports = {
  block: buildBlock,
  run: runBlock
}
