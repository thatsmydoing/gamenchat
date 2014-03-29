angular.module('chatServices', [])
.factory('Connection', function($rootScope, $timeout, $interval, $location) {
  var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
  var chatSocket = null;
  var ping = null;

  var service = {
    username: '',
    error: null,
    messages: [],
    status: 'disconnected',
    hasRoom: function() {
      return $location.path() != '';
    },
    isConnected: function() {
      return this.status == 'connected';
    },
    addListener: function(f) {
      messageListeners.add(f);
    }
  };

  function wrap(func) {
    return function() {
      var args = arguments;
      $timeout(function() {
        func.apply(null, args);
      });
    }
  };

  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  function getRoom() {
    if(!$location.path()) {
      $location.path(makeid());
    }
    return $location.path();
  }

  service.connect = function(username) {
    if(service.status != 'disconnected') return;
    service.error = null;
    service.status = 'connecting';

    var url = jsRoutes.controllers.Application.chat(username, getRoom()).webSocketURL();
    if(window.location.hostname == "gamenchat.pleasantprogrammer.com" && window.location.port == "") {
      url = url.replace("gamenchat.pleasantprogrammer.com", "$&:8000");
    }
    chatSocket = new WS(url);
    chatSocket.onmessage = wrap(function(event) {
      var message = JSON.parse(event.data);
      if(message.error) {
        service.error = message.error;
      }
      if(message.kind != "pong") {
        $rootScope.$broadcast('ws:message', message);
      }
    });
    chatSocket.onopen = wrap(function() {
      $rootScope.$broadcast('ws:connected', username);
      service.status = 'connected';
      service.username = username;
      ping = $interval(function() {
        service.send('/ping');
      }, 60000, 0, false);
    });
    chatSocket.onclose = wrap(function() {
      $rootScope.$broadcast('ws:disconnected');
      service.status = 'disconnected';
      service.username = '';
      $interval.cancel(ping);
    });
  }

  service.disconnect = function() {
    chatSocket.close();
    chatSocket = null;
  }

  service.send = function(message) {
    chatSocket.send(JSON.stringify({text: message}));
  }

  return service;
})
.factory('Chat', function($rootScope, Connection) {
  var service = {
    username: '',
    messages: [],
    receive: function(message) {
      if(arguments.length == 3) {
        message = {
          kind: arguments[0],
          user: arguments[1],
          message: arguments[2]
        };
      }
      service.messages.push(message);
      $rootScope.$broadcast('chat:message', message);
    },
    send: Connection.send
  };

  $rootScope.$on('ws:connected', function(event, username) {
    service.username = username;
  });
  $rootScope.$on('ws:message', function(event, message) {
    if(message.kind == "talk") {
      service.receive(message);
    }
    else if(message.kind == "join") {
      service.receive("join", message.user, " has joined.");
    }
    else if(message.kind == "quit") {
      service.receive("quit", message.user, " has left.");
    }
  });
  $rootScope.$on('ws:disconnected', function() {
    service.messages = [];
    service.username = '';
  });

  if(Connection.isConnected()) {
    service.username = Connection.username;
  }

  return service;
})
