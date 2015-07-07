var Cycle = require('cyclejs');
var Rx = Cycle.Rx;
var h = Cycle.h;
var about = require('./templates/about');

var nav = [
  {partial: 'about', name: 'About'},
  {partial: 'chatRoom', name: 'Chat'},
  {partial: 'contribute', name: 'Contribute'}
];

function intent(drivers) {
  var DOM = drivers.DOM;
  return {
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
  return {
    username$: actions.login$
      .withLatestFrom(actions.username$, function(submit, username) {
        return username;
      })
      .merge(actions.disconnect$.map(function() { return null; }))
      .startWith(null)
    ,
    route$: Rx.Observable.fromEvent(window, 'hashchange')
      .map(function(hashEvent) { return hashEvent.target.location.hash.replace('#', '') })
      .startWith(window.location.hash.replace('#', '') || 'about')
  }
}

function renderLogin(username) {
  var content;
  if(!username) {
    content = [ h('a.navbar-link', {href: '#chatRoom'}, ['Play!']) ];
  }
  if(username) {
    content = [
      "Logged in as "+username+" — ",
      h('a.navbar-link#disconnect', ['Disconnect'])
    ];
  }
  return h('div', {className: 'navbar-right collapse navbar-collapse'}, [
    h('p.navbar-text', content)
  ]);
}

function renderNav(route, username) {
  return (
    h('nav', {className: 'navbar navbar-inverse navbar-static-top', role: 'navigation'}, [
      h('div.container', [
        h('div.navbar-header', [
          h('span.brand.navbar-brand', ["Game 'n Chat"])
        ]),
        h('ul', {className: 'nav navbar-nav collapse navbar-collapse'}, nav.map(function(item) {
          var className = '';
          if(item.partial == route) {
            className = 'active';
          }
          return h('li', {className: className}, [
            h('a', {href: '#'+item.partial}, [ item.name ])
          ]);
        })),
        renderLogin(username)
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

function renderContainer(route) {
  var content = require('./templates/'+route)();
  return h('div.container', [
    h('div.content', [content]),
    renderFooter()
  ]);
}

function view(model) {
  return Rx.Observable.combineLatest(
    model.route$,
    model.username$,
    function(route, username) {
      return h('div', [
        renderNav(route, username),
        renderContainer(route)
      ]);
    }
  );
}

function main(drivers) {
  return { DOM: view(model(intent(drivers))) };
}

Cycle.run(main, {
  DOM: Cycle.makeDOMDriver('body')
});
