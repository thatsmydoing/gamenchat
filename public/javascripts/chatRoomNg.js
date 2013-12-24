angular.module('tabooServices', [])
.factory('connectionService', function($rootScope) {
  var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
  var chatSocket = null;

  var service = {
    username: '',
    messages: [],
    teamA: {},
    teamB: {},
    error: null,
    isConnected: function() {
      return this.username != '';
    },
  };

  service.connect = function(username) {
    chatSocket = new WS(jsRoutes.controllers.Application.chat(username).webSocketURL());
    chatSocket.onmessage = onEvent;
    chatSocket.onopen = function() {
      service.send("/status");
    }
    service.username = username;
  }

  service.disconnect = function() {
    service.username = '';
    service.messages = [];
    service.members = [];
    chatSocket.close();
    chatSocket = null;
  }

  service.send = function(message) {
    chatSocket.send(JSON.stringify({text: message}));
  }

  function onEvent(event) {
    var message = JSON.parse(event.data);
    console.log(message);
    if(message.error) {
      service.error = message;
    }
    else if(message.kind == "talk") {
      service.messages.push(message);
    }
    else if(message.kind == "join") {
      addMessage("join", message.user, " has joined.");
    }
    else if(message.kind == "quit") {
      addMessage("quit", message.user, " has left.");
    }
    else if(message.kind == "point") {
      var text = "";

      if(message.action == "correct") {
        text = message.user + " got it!";
      }
      else if(message.action == "invalid") {
        text = "Uh-uh! You said a taboo word.";
      }
      else if(message.action == "pass") {
        text = "Tsk tsk. You passed.";
      }
      else if(message.action == "taboo") {
        text = "Oh no! "+message.user+" has called you out.";
      }

      text += " The last word was "+message.card.word+".";
      gmMessage(text);
      service.points = message.points;
    }
    else if(message.kind == "roundReady") {
      gmMessage("Next round, the player will be "+message.player);
      if(message.player == service.username) {
        service.startReady = true;
      }
    }
    else if(message.kind == "roundStart") {
      gmMessage("Start game!");
      service.startReady = false;
      service.startTime = new Date();
      service.points = 0;
    }
    else if(message.kind == "roundEnd") {
      if(message.card) {
        gmMessage("Time's up! The last word was "+message.card.word+".");
      }
      gmMessage("The round has ended. The team got "+message.points+".");
      service.startReady = false;
    }
    else if(message.kind == "card") {
      service.card = message.card;
    }
    else if(message.kind == "status") {
      updateStatus(message);
    }
    $rootScope.$apply();
  }

  function updateStatus(message) {
    service.teamA = message.teamA;
    service.teamB = message.teamB;
  }

  function addMessage(kind, user, message) {
    service.messages.push({
      kind: kind,
      user: user,
      message: message
    });
  }

  function gmMessage(message) {
    addMessage("talk", "*GM", message);
  }

  return service;
});

angular.module('taboo', ['tabooServices']);

function partial(template) {
  return jsRoutes.controllers.Assets.at('partials/'+template+'.html').url;
}

function ViewCtrl($scope) {
  $scope.partial = partial;
}

function LoginCtrl($scope, connectionService) {
  $scope.service = connectionService;
}

function ChatCtrl($scope, connectionService) {
  $scope.service = connectionService;

  $scope.onType = function(event) {
    if(event.keyCode == 13) {
      connectionService.send($scope.text);
      $scope.text = '';
      event.originalEvent.preventDefault();
    }
  }
}
