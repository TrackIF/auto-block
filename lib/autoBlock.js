var _ = require('lodash')
var async = require('async')
var httpStatus = require('http-status')

// var errors = require('./errors')
// var logging = require('./logging')
var utils = require('./utilities')

// TODO reject invalid options/flags (e.g., errorDeafults typos)

// Creates a lambda handler from common block/controller pattern
function lambdaHandler (handler, done) {
  // If no explicit done() provided, use the one from the lambda context
  if (!handler.done) {
    handler.done = handler.context.done || done || (() => {
    })
  }

  // Setup noop logging hooks
  if (!handler.start) {
    handler.start = () => {
    }
  }

  if (!handler.success) {
    handler.success = () => {
    }
  }

  if (!handler.failure) {
    handler.failure = () => {
    }
  }

  if (!handler.startStep) {
    handler.startStep = () => {
    }
  }

  if (!handler.finishStep) {
    handler.finishStep = () => {
    }
  }

  handler.start(handler.event, handler.context)

  // Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
  if (!handler.block.options) {
    var options = utils.mappingBlock(handler, handler.optionsMapping, handler.optionsDefaults)
    handler.block['options'] = {
      value: options
    }
  }

  var autoBlock = buildBlock(handler.block, handler)
  var autoCb = (error, results) => lambdaFinish(error, results, handler)
  try {
    async.auto(autoBlock, autoCb)
  } catch (e) {
    autoCb(e)
  }
}

// Resolve the error and results
function lambdaFinish (error, results, handler) {
  var data = {
    error: error,
    event: handler.event,
    context: handler.context,
    results: results
  }

  // Map response if desired; can access raw error object
  if (handler.responseMapping) {
    data.response = utils.mappingBlock(data, handler.responseMapping)
  }

  // Map error if desired; can access response object
  if (error && !error.requestId && (handler.errorMapping || handler.errorDefaults)) {
    error = utils.mapError(data, handler.errorMapping, handler.errorDefaults)
  }

  var status = _.get(error, 'data.status')
  if (error && error.message && status) {
    error.message = (httpStatus[status] || status) + `: ${error.message}`
  }

  if (error) {
    handler.failure(error, handler.context)
  } else {
    handler.success(data.response, handler.context)
  }

  var done = handler.done
  if (done) {
    // Lambda will automatically retry if you send the error back
    if (!_.get(error, 'data.retry', true)) {
      error = null
    }
    process.nextTick(() => done(error, data.response))
  }
}

// Build out an async.auto block using our special notation
//
// EXAMPLE USAGE:
// var block = {
//   'options': {
//     value: options
//   },
//   'feedConfig': {
//     func: helpers.clients.getClientConfig,
//     after: ['options'],
//     with: [
//       'options.slug',
//       'options.feed'
//     ]
//   },
//   'redshiftPassword': {
//     func: helpers.secrets.kmsDecrypt,
//     after: ['feedConfig'],
//     with: {
//       'payload': 'feedConfig.import.redshiftPassword'
//     }
//   }
// }
function buildBlock (block, handler) {
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
      asyncFunc = (results, cb) => blockStep(results, cb, step, handler)
    } else {
      asyncFunc = (cb) => blockStep(null, cb, step, handler)
    }

    // async.auto takes the callback as the final element in the depedencies array
    deps.push(asyncFunc)

    asyncBlock[key] = deps
  }, {})

  return autoBlock
}

// Run an individual step
function blockStep (results, callback, step, handler) {
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

  // Run the inner function using the lambda wrappers
  lambdaStep(results, callback, step, handler)
}

// Log and run the step with lambda logging
function lambdaStep (results, callback, step, handler) {
  var func = step.func
  var start = Date.now()

  handler.startStep(step.name, handler.context)

  var args = utils.mappingArgs(results, step.with)

  var cb = (err, result) => {
    var stepOutput = {
      error: !!err,
      result: !!result,
      timer: (Date.now() - start) / 1000
    }
    handler.finishStep(step.name, handler.context, JSON.stringify(stepOutput, null, 2))

    if (err && (step.errorMapping || step.errorDefaults)) {
      var errorOptions = {
        error: err,
        results: results,
        event: handler.event,
        context: handler.context
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
  buildBlock: buildBlock,
  lambdaHandler: lambdaHandler,
  lambdaFinish: lambdaFinish
}
