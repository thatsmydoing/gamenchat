var Cycle = require('cyclejs');
var Rx = Cycle.Rx;
var RxDOM = require('rx-dom').DOM;
var h = Cycle.h;

var hashDriver = require('./drivers/hashDriver');
var util = require('./util');
var chat = require('./services/chat');

var nav = [
  {partial: 'about', name: 'About'},
  {partial: 'chatRoom', name: 'Chat'},
  {partial: 'contribute', name: 'Contribute'}
];

function intent(drivers) {
  var DOM = drivers.DOM;
  return {
    contribute: require('./intents/contribute')(drivers),
    route$: drivers.hash.map(function(route) {
      return route || 'about';
    }),
    chat$: DOM.get('#talk', 'input').map(function(ev) {
      return ev.target.value;
    }).startWith('').shareReplay(1),
    send$: DOM.get('#talk', 'keyup').filter(function(ev) {
      return ev.keyCode == 13 && ev.target.value.trim();
    }).shareReplay(1),
    disconnect$: DOM.get('#disconnect', 'click'),
    username$: DOM.get('#username', 'input').map(function(ev) {
      return ev.target.value;
    }),
    login$: DOM.get('#login-form', 'submit').map(function(ev) {
      ev.preventDefault();
      return true;
    })
  };
}

function model(actions) {
  var route$ = actions.route$.shareReplay(1);

  var username$ = actions.login$
    .withLatestFrom(actions.username$, function(submit, username) {
      return username;
    })
    .merge(actions.disconnect$.map(function() { return null; }))
    .startWith(null)
    .shareReplay(1)

  var room$ = route$
    .map(function(url) {
      if(url.startsWith('chatRoom/')) {
        return url.replace('chatRoom/', '');
      }
      else {
        return null;
      }
    })
    .startWith(null)
    .distinctUntilChanged();

  var outgoing$ = util.sync(actions.send$, actions.chat$)
    .map(function(msg) {
      return JSON.stringify({text: msg});
    })

  var results = chat.connect(username$, room$, outgoing$);

  var newRoute$ = results.details$
    .filter(function(params) {
      return params.username != null;
    })
    .map(function(params) {
      return 'chatRoom/'+params.room;
    })
    .distinctUntilChanged()

  var input$ = actions.chat$.merge(actions.send$.map(function() { return '' }));

  var messages$ = results.ws$
    .map(function(message) {
      if(message.kind === 'talk') {
        return message;
      }
      else if(message.kind == "join") {
        return {
          kind: 'join',
          user: message.user,
          message: ' has joined.'
        };
      }
      else if(message.kind == "quit") {
        return {
          kind: 'quit',
          user: message.user,
          message: ' has left.'
        };
      }
      else return null;
    })
    .filter(function(item) {
      return item != null;
    })
    .scan([], function(a, b) {
      a.push(b);
      return a;
    })
    .startWith([])

  return {
    hash: newRoute$,
    DOM: {
      username$: username$,
      room$: room$,
      details$: results.details$,
      route$: route$,
      status$: results.status$,
      error$: results.error$,
      chat$: input$,
      contribute$: actions.contribute.fields$
    }
  };
}

function renderLogin(props) {
  var isConnected = props.status === 'connected';
  var content;
  if(!isConnected) {
    content = [ h('a.navbar-link', {href: '#chatRoom'}, ['Play!']) ];
  }
  else {
    content = [
      "Logged in as "+props.username+" — ",
      h('a.navbar-link#disconnect', ['Disconnect'])
    ];
  }
  return h('div', {className: 'navbar-right collapse navbar-collapse'}, [
    h('p.navbar-text', content)
  ]);
}

function renderNav(props) {
  return (
    h('nav', {className: 'navbar navbar-inverse navbar-static-top', role: 'navigation'}, [
      h('div.container', [
        h('div.navbar-header', [
          h('span.brand.navbar-brand', ["Game 'n Chat"])
        ]),
        h('ul', {className: 'nav navbar-nav collapse navbar-collapse'}, nav.map(function(item) {
          var link = '#'+item.partial;
          if(item.partial === 'chatRoom' && props.status === 'connected' && props.details.room) {
            link += '/' + props.details.room;
          }
          var className = '';
          if(item.partial == props.route) {
            className = 'active';
          }
          return h('li', {className: className}, [
            h('a', {href: link}, [ item.name ])
          ]);
        })),
        renderLogin(props)
      ]),
    ])
  )
}

function renderFooter() {
  return h('footer', [
    h('p', [
      h('a', {href: 'http://twitter.com/pleasantprog', target: '_blank'}, ['@pleasantprog'])
    ])
  ]);
}

function renderContainer(props) {
  var route = props.route.replace(/\/.*/, '');
  var content = require('./templates/'+route)(props);
  return h('div.container', [
    h('div.content', [content]),
    renderFooter()
  ]);
}

function view(model) {
  return {
    hash: model.hash,
    DOM:
      util.asObject(model.DOM).map(function(model) {
        return h('div', [
          renderNav(model),
          renderContainer(model)
        ]);
      })
  }
}

function main(drivers) {
  return view(model(intent(drivers)));
}

Cycle.run(main, {
  DOM: Cycle.makeDOMDriver('body'),
  hash: hashDriver
});
