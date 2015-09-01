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

function flatten(obj) {
  var ret = {};
  _.forEach(obj, function(val, key) {
    if(_.isPlainObject(val)) {
      var o = flatten(val);
      _.forEach(o, function(val, innerKey) {
        ret[key+'.'+innerKey] = val;
      });
    }
    else {
      ret[key] = val;
    }
  });
  return ret;
}

function _set(obj, key, val) {
  var pos = key.indexOf('.');
  if(pos < 0) {
    obj[key] = val;
  }
  else {
    var parent = key.substr(0, pos);
    if(!obj[parent]) {
      obj[parent] = {};
    }

    var rest = key.substr(pos+1);
    _set(obj[parent], rest, val);
  }
}

function unflatten(obj) {
  var ret = {};
  var set = _.bind(_set, null, ret);
  _.forEach(obj, function(val, key) {
    set(key, val);
  });
  return ret;
}

function asObject(params) {
  params = flatten(params);
  var keys = _.keys(params).map(function(key) {
    return key.replace(/\$$/, '');
  });
  var vals = _.values(params);
  return Rx.Observable.combineLatest(vals, function() {
    return unflatten(_.zipObject(keys, arguments));
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
