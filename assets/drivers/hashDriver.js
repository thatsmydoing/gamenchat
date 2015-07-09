var Rx = require('cyclejs').Rx;

module.exports = function(outgoing$) {
  outgoing$.subscribe(function(newHash) {
    window.location.hash = newHash;
  });
  return Rx.Observable.fromEvent(window, 'hashchange')
    .map(function(hashEvent) { return hashEvent.target.location.hash.replace('#', '') })
    .startWith(window.location.hash.replace('#', '') || '')
}
