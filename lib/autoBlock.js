import * as _ from 'lodash'
import * as async from 'async'
import * as httpStatus from 'http-status'

import * as builder from './builder'
import * as utils from './utilities'
import * as stepHelper from './step'
// import * as validate from './validate'

// Runs a block using common block/controller pattern
function runBlock (config, done) {
  var noop = () => { }
  config.done = config.done || done || noop

  setupErrorSuppress(config)
  setupOptions(config)

  var controller = builder.buildController(config, async.auto, runStep)

  stepHelper.run(controller, (err, results) => {
    var status = _.get(err, 'data.status')
    if (err && err.message && status) {
      err.message = (httpStatus[status] || status) + `: ${err.message}`
    }

    var done = controller.done
    if (done) {
      process.nextTick(() => done(err, results))
    }
  })
}

// Lambda will automatically retry if you send the error back
function setupErrorSuppress (config) {
  config.errorSuppress = config.errorSuppress || {'data.retry': false}
  if (_.isString(config.errorSuppress)) {
    config.errorSuppress = [config.errorSuppress]
  }
}

// Use optionsMapping and optionsDefaults to build out options if none were explicitly provided on the block
function setupOptions (config) {
  var options = {}
  if (config.block && !config.block.options) {
    options = utils.mappingBlock(config.data, config.optionsMapping, config.optionsDefaults)
    config.block['options'] = {
      value: options
    }

    // TODO don't override explicitly set options
    config.options = options
  }
}

// Run an individual step
// Log and run the step with logging
// TODO 2.0 cleanup these weird mapping rules
function runStep (results, callback, step, config) {
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
  fixed.responseMapping = fixed.responseMapping || 'result'

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
  block: builder.buildBlock,
  run: runBlock
}
