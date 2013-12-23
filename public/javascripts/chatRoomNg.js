angular.module('tabooServices', [])
.factory('connectionService', function($rootScope) {
  var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
  var chatSocket = null;

  var service = {
    username: '',
    messages: [],
    members: [],
    error: null,
    isConnected: function() {
      return this.username != '';
    },
  };

  service.connect = function(username) {
    chatSocket = new WS(jsRoutes.controllers.Application.chat(username).webSocketURL());
    chatSocket.onmessage = onEvent;
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
    if(message.error) {
      service.error = message;
    }
    else {
      service.messages.push(message);
      service.members = message.members;
    }
    $rootScope.$apply();
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
