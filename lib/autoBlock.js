var _ = require('lodash')
var async = require('async')
var httpStatus = require('http-status')

var utils = require('./utilities')

// TODO reject invalid options/flags (e.g., errorDeafults typos)

// Runs a block using common block/controller pattern
function runBlock (config, done) {
  // If no explicit done() provided, use the one from the lambda context
  if (!config.done) {
    config.done = config.context.done || done || (() => {
    })
  }

  // Setup noop logging hooks
  if (!config.start) {
    config.start = () => {
    }
  }

  if (!config.success) {
    config.success = () => {
    }
  }

  if (!config.failure) {
    config.failure = () => {
    }
  }

  if (!config.startStep) {
    config.startStep = () => {
    }
  }

  if (!config.finishStep) {
    config.finishStep = () => {
    }
  }

  config.start(config.event, config.context)

  // Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
  if (!config.block.options) {
    var options = utils.mappingBlock(config, config.optionsMapping, config.optionsDefaults)
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
  var data = {
    error: error,
    event: config.event,
    context: config.context,
    results: results
  }

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
    config.failure(error, config.context)
  } else {
    config.success(data.response, config.context)
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
    // If no name was provided, use the key. This is used during logging.
    step.name = step.name || key

    // Figure out which steps need to come before this one
    // - anything in .after
    // - the first path segement in each .with
    // - the first path segement in each .when
    var deps = (step.after || []).slice()

    var withDeps = (step.with || [])
    if (_.isString(withDeps)) {
      withDeps = [withDeps]
    }
    withDeps = _.map(withDeps, (value) => _.first(_.split(value, '.')))

    var whenDeps = (step.when || [])
    if (_.isString(whenDeps)) {
      whenDeps = [whenDeps]
    }
    whenDeps = _.map(whenDeps, (value) => {
      var dep = _.first(_.split(value, '.'))
      if (_.first(dep) === '!') {
        return dep.substring(1)
      }

      return dep
    })

    deps = _.union(deps, withDeps, whenDeps)

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

  // Only run this step if all .when values resolve truthy. (But don't error; just skip the step if a check fails.)
  var checks = step.when || []
  if (!_.isArray(checks)) {
    checks = [checks]
  }
  var valid = _.every(checks, (check) => {
    if (_.first(check) === '!') {
      return !_.get(results, check.substring(1))
    }

    return _.get(results, check)
  })

  if (!valid) {
    return callback()
  }

  // Run the inner function using the wrappers
  runStepFunc(results, callback, step, config)
}

// Log and run the step with logging
function runStepFunc (results, callback, step, config) {
  var func = step.func
  var start = Date.now()

  config.startStep(step.name, config.context)

  var args = utils.mappingArgs(results, step.with)

  var cb = (err, result) => {
    var stepOutput = {
      error: !!err,
      result: !!result,
      timer: (Date.now() - start) / 1000
    }
    config.finishStep(step.name, config.context, JSON.stringify(stepOutput, null, 2))

    if (err && (step.errorMapping || step.errorDefaults)) {
      var errorOptions = {
        error: err,
        results: results,
        event: config.event,
        context: config.context
      }
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

module.exports = {
  block: buildBlock,
  run: runBlock
}
