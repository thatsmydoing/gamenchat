var h = require('cyclejs').h;
var util = require('../util');
var cx = util.classNames;

function renderLogin(props) {
  var disconnected = props.status === 'disconnected';
  var error = props.error;
  var hasRoom = props.room != null;
  return (
    h("div.row", [
      error ? h("div.alert.alert-danger", [
        h("strong", [ "Oops!" ]), ' ' + error + "."
      ]) : null,
      h("div#login", [
        disconnected ? h("form.form-inline#login-form", [
          h("input#username.form-control", {
              "name": "username",
              "type": "text",
              "placeholder": "Username"
          }),
          h("br"),
          h("br"),
          h("button.btn", { "type": "submit" }, [ hasRoom ? 'Join Room' : 'Create New Room' ])
        ]) : null
      ])
    ])
  )
}

function renderChat(props) {
  var height = window.innerHeight - 300;
  var element = document.getElementById('messages');
  var scrollTop = util.propHook(function(node) {
    setTimeout(function() {
      node.scrollTop = node.scrollHeight;
    }, 100);
  });
  var messages = props.messages;
  return (
    h("div#main.col-md-9", [
      h("div#messages", { scrollTop: scrollTop, style: { height: height+'px' } }, [
        h("table", messages.map(function(message) {
          var classes = cx('message', message.kind, {
            me: message.user === props.username
          });
          return h("tr"+classes, [
            h("td.user", [ message.user ]),
            h("td", [ message.message ])
          ]);
        }))
      ]),
      h("input#talk.form-control", {
          "type": "text",
          "value": props.chat
      })
    ])
  )
}

function renderSidebar() {
  return (
    h("div.col-md-3", {
        "ng-controller": "GameCtrl"
    }, [
      h("button.btn.btn-primary", {
          "ng-show": "game.pendingRound",
          "ng-click": "game.startRound()"
      }, [ "Start" ]),
      h("div", {
          "ng-if": "game.roundRunning()"
      }, [
        h("h2", [ h("ng-pluralize", {
            "count": "game.timer.count",
            "when": "{'0': 'Time\\'s up!', 'one': '1 second', 'other': '{} seconds'}"
        }) ]),
        h("h2", [ h("ng-pluralize", {
            "count": "game.points",
            "when": "{'one': '1 point', 'other': '{} points'}"
        }) ]),
        h("hr")
      ]),
      h("div", {
          "ng-if": "game.roundRunning()"
      }, [
        h("h3", {
            "ng-show": "game.isPlayer()"
        }, [ "you are the giver" ]),
        h("h3", { "ng-show": "game.isMonitor()"
        }, [ "you are a monitor" ]),
        h("h3", {
            "ng-show": "game.isGuesser()"
        }, [ "you are a guesser" ]),
        h("button.btn.btn-warning", {
            "ng-show": "game.isPlayer()",
            "ng-click": "game.pass()"
        }, [ "Pass" ]),
        h("button.btn.btn-danger", {
            "ng-show": "game.isMonitor()",
            "ng-click": "game.taboo()"
        }, [ "Uh-uh!" ]),
        h("button.btn.btn-success", {
            "ng-show": "game.isMonitor() || game.isPlayer()",
            "ng-click": "game.correct()"
        }, [ "Correct" ])
      ]),
      h("div", {
          "ng-show": "game.card"
      }, [
        h("h2", [ "Card" ]),
        h("h3", [ "{{game.card.word}}" ]),
        h("ul.taboo", [
          h("li", {
              "ng-repeat": "word in game.card.taboo"
          }, [ "{{word}}" ])
        ])
      ]),
      h("h2", [ "Team A" ]),
      h("ul.members", [
        h("li", {
            "ng-repeat": "member in game.teamA.members"
        }, [ "{{member}}" ])
      ]),
      h("h2", [ "Team B" ]),
      h("ul.members", [
        h("li", {
            "ng-repeat": "member in game.teamB.members"
        }, [ "{{member}}" ])
      ])
    ])
  )
}

function renderMain(props) {
  return h("div.row", [
    renderChat(props)
  ])
}

module.exports = function(props) {
  var isConnected = props.status === 'connected';
  return (
    h("div", [
      h("div.page-header", [
        h("h1", isConnected ?
          [ "Welcome ", h("small", [ "You are playing as "+props.username ]) ]
          :
          [ "Welcome ", h("small", [ "login to play" ]) ]
         )
      ]),
      isConnected ? renderMain(props) : renderLogin(props)
    ])
  );
}
