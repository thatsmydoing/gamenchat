var _ = require('lodash');
var util = require('../util');

module.exports = function(drivers) {
  var DOM = drivers.DOM;

  function input(elem) {
    return DOM.get('#'+elem, 'input').map(function(ev) { return ev.target.value }).startWith('');
  }

  var labels = ['inputWord'].concat([0,1,2,3,4].map(function(item) { return 'taboo'+item }));
  var streams = labels.map(input);

  var textFields$ = util.asObject(_.zipObject(labels, streams));

  var submit$ = DOM.get('#cardForm', 'submit').doOnNext(function(ev) { ev.preventDefault() });
  var form$ = util.sync(submit$, textFields$);

  return {
    fields$: textFields$,
    form$: form$
  };
}
