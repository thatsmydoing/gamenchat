var h = require('cyclejs').h;

function renderLogin() {
  var disconnected = true;
  var error = null;
  var hasRoom = false;
  return (
    h("div.row", [
      error && h("div.alert.alert-danger", [
        h("strong", [ "Oops!" ]), error + "."
      ]),
      h("div#login", [
        disconnected && h("form.form-inline#login-form", [
          h("input#username.form-control", {
              "name": "username",
              "type": "text",
              "ng-model": "username",
              "placeholder": "Username"
          }),
          h("br"),
          h("br"),
          h("button.btn", {
              "type": "submit",
              "ng-click": "service.connect(username); username=''"
          }, [ hasRoom ? 'Join Room' : 'Create New Room' ])
        ])
      ])
    ])
  )
}

function renderChat(messages, me) {
  return (
    h("div#main.col-md-9", [
      h("div#messages", [
        h("table", messages.map(function(message) {
          var classes = '.message';
          classes += '.'+message.kind;
          if(message.user == me) {
            classes += '.me';
          }
          return h("tr"+classes, [
            h("td.user", [ message.user ]),
            h("td", [ message.message ])
          ]);
        })),
        h("input#talk.form-control", {
            "type": "text",
            "ng-model": "text",
            "ng-keypress": "onType($event)"
        })
      ])
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
        h("h3", {
            "ng-show": "game.isMonitor()"
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

function renderMain() {
  return h("div.row", [
    renderChat(),
    renderSideBar()
  ])
}

module.exports = function() {
  var isConnected = false;
  return (
    h("div", [
      h("div.page-header", [
        h("h1", isConnected ?
          [ "Welcome ", h("small", [ "You are playing as {{service.username}}" ]) ]
          :
          [ "Welcome ", h("small", [ "login to play" ]) ]
         )
      ]),
      isConnected ? renderMain() : renderLogin()
    ])
  );
}
