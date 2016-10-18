var _ = require('lodash')

function resultBlock (config, error, results) {
  var data = _.clone(config.data)
  data.error = data.error || error
  data.results = data.results || results

  return data
}

function mappingBlock (data, mapping, defaults, result) {
  if (_.isString(mapping)) {
    return _.get(data, mapping)
  }

  result = result || {}

  var mappedDefaults = _.transform(defaults, (target, value, key) => {
    _.set(target, key, value)
  }, {})

  var mapped = _.transform(mapping, (target, value, key) => {
    _.set(target, key, _.get(data, value))
  }, result)

  result = _.defaultsDeep(result, mapped, mappedDefaults)

  return result
}

function mappingArgs (data, mapping, defaults) {
  var args = []

  if (!_.isArray(mapping)) {
    mapping = [mapping]
  } else if (defaults) {
    throw new Error('Invalid settings: Cannot use .withDefaults with array notation.')
  }

  _.forEach(mapping, (value, key) => {
    console.log('mappingArgs', key, value, defaults)
    args.push(mappingBlock(data, value, defaults))
  })

  return args
}

function buildError (options) {
  options = _.cloneDeep(options || {})

  var original = options.error
  delete options.error

  var built = original

  if (!built) {
    var message = _.get(options, 'external.message')
    message = message || options.message
    message = message || 'Unknown error'
    built = new Error(message)
  }

  built.data = _.defaultsDeep(options, built.data)
  return built
}

function mapError (options, mapping, defaults) {
  var data = _.cloneDeep(_.get(options, 'error.data'))
  data = mappingBlock(options, mapping, defaults, data)
  if (options.error && !data.error) {
    data.error = options.error
  }
  return buildError(data)
}

module.exports = {
  buildError: buildError,
  resultBlock: resultBlock,
  mapError: mapError,
  mappingBlock: mappingBlock,
  mappingArgs: mappingArgs
}
