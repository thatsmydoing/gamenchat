var RxDOM = require('rx-dom').DOM;
var _ = require('lodash');
var util = require('../util');

function byVal(val) {
  return function(msg) {
    return msg === val;
  }
}

function byKind(kind) {
  return function(msg) {
    return msg.kind === kind;
  }
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function connect(username$, room$, outgoing$) {
  var currRoom$ = room$.map(function(room) {
    return room || makeid();
  }).distinctUntilChanged().shareReplay(1);

  var details$ = username$.withLatestFrom(currRoom$, function(username, room) {
    return {
      username: username,
      room: room
    }
  });

  var nullSubject = Rx.Subject.create(Rx.Observer.create(), Rx.Observable.empty());

  var connection$ = details$
    .map(function(params) {
      if(params.username == null) {
        return { ws$: nullSubject, open$: nullSubject }
      }

      var url = jsRoutes.controllers.Application.chat(params.username, params.room).webSocketURL();
      var open = new Rx.Subject();
      return {
        ws$: RxDOM.fromWebSocket(url, 'chat', open.asObserver()),
        open$: open.map(function() { return 'connected' }).startWith('connecting')
      };
    }).share();

  var ws$ = connection$
    .flatMapLatest(function(conn) {
      return conn.ws$
        .map(function(ev) { return JSON.parse(ev.data) })
        .onErrorResumeNext(Rx.Observable.just({kind: 'disconnected'}));
    })
    .share();

  connection$.subscribe(function(conn) {
    outgoing$.subscribe(conn.ws$.asObserver());
  });

  var status$ = ws$
    .filter(byKind('disconnected'))
    .map(function() { return 'disconnected' })
    .merge(connection$.flatMapLatest(function(conn) { return conn.open$ }))
    .startWith('disconnected')
    .distinctUntilChanged()

  var error$ = ws$
    .map(function(msg) { return msg.error })
    .filter(_.isString)
    .merge(status$.filter(byVal('connecting')).map(function() { return '' }))
    .startWith('')

  return {
    ws$: ws$,
    details$: details$,
    status$: status$,
    error$: error$
  };
}

module.exports = {
  connect: connect
}
