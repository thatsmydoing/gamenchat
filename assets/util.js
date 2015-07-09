var Rx = require('cyclejs').Rx;
var _ = require('lodash');


// modified from https://github.com/JedWatson/classnames/blob/master/index.js
function classNames () {

  var classes = '';

  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (!arg) continue;

    var argType = typeof arg;

    if ('string' === argType || 'number' === argType) {
      classes += '.' + arg;

    } else if (Array.isArray(arg)) {
      classes += '.' + classNames.apply(null, arg);

    } else if ('object' === argType) {
      for (var key in arg) {
        if (arg.hasOwnProperty(key) && arg[key]) {
          classes += '.' + key;
        }
      }
    }
  }

  return classes;
}

function log(label) {
  return _.bind(console.log, console, label);
}

function asObject(params) {
  var keys = _.keys(params).map(function(key) {
    return key.replace(/\$$/, '');
  });
  var vals = _.values(params);
  return Rx.Observable.combineLatest(vals, function() {
    return _.zipObject(keys, arguments);
  });
}

function sync(trigger$, data$) {
  return trigger$.withLatestFrom(data$, function(a, b) {
    return b;
  });
}

function PropertyHook(fn) {
  this.fn = fn;
}
PropertyHook.prototype.hook = function() {
  this.fn.apply(this, arguments);
}

function propHook(fn) {
  return new PropertyHook(fn);
}

module.exports = {
  asObject: asObject,
  sync: sync,
  log: log,
  classNames: classNames,
  propHook: propHook
};
