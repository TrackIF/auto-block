import * as _ from 'lodash'

import * as validate from './validate'

function buildController (config) {
  config.data = config.data || {}

  // Setup default logging hook mappings
  // TODO 2.0 make these defaults less weird
  buildHook(config, 'onStart', { with: ['data'] })
  buildHook(config, 'onSuccess', { with: ['response', 'default'] })
  buildHook(config, 'onFailure', { with: ['error', 'default'] })

  buildHook(config, 'onStartStep', { with: ['step.name', 'data'] })
  buildHook(config, 'onFinishStep', {
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

  return config
}

// Build out an async.auto block using our special notation
function buildBlock (config, runner) {
  var block = config.block
  var autoBlock = _.transform(block, (asyncBlock, step, key) => {
    asyncBlock[key] = buildStep(step, config, runner)
  }, {})

  return autoBlock
}

function buildHook (config, path, defaults) {
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

function buildStep (step, config, fn) {
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
    asyncFunc = (results, cb) => fn(results, cb, step, config)
  } else {
    asyncFunc = (cb) => fn(null, cb, step, config)
  }

  // async.auto takes the callback as the final element in the depedencies array
  deps.push(asyncFunc)

  return deps
}

module.exports = {
  buildBlock: buildBlock,
  buildController: buildController,
  buildHook: buildHook,
  buildStep: buildStep
}
