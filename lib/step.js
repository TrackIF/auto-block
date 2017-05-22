var _ = require('lodash')
var async = require('async')
var utils = require('./utilities')

function stepOuter (options, callback) {
  var step = options.step
  var source = _.cloneDeep(options.source)

  var func = step.func
  if (!func && step.sync) {
    func = async.asyncify(step.sync)
  }

  source.start = source.start || Date.now()

  var args = utils.mappingArgs(source, step.with, step.withDefaults)

  var cb = (err, result) => {
    var dest = _.cloneDeep(source)
    dest.error = err
    dest.result = result
    dest.stop = Date.now()
    dest.timer = (dest.stop - dest.start) / 1000

    if (dest.error && (step.errorMapping || step.errorDefaults)) {
      err = utils.mapError(dest, step.errorMapping, step.errorDefaults)
    }

    callback(err, dest)
  }
  args.push(cb)

  try {
    func.apply(null, args)
  } catch (e) {
    cb(e)
  }
}

module.exports = {
  stepOuter: stepOuter
}
