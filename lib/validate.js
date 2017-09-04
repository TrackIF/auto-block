import * as _ from 'lodash'

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
  'options', // TODO hack to avoid validation error
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
  'errorSuppress',
  'func',
  'name',
  'responseDefaults',
  'responseMapping',
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
  settings: validateSettings,
  blockSettings: validateBlockSettings,
  handlerSettings: validateHandlerSettings
}
