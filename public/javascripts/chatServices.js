angular.module('chatServices', [])
.factory('Connection', function($rootScope, $timeout, $interval) {
  var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
  var chatSocket = null;
  var ping = null;

  var service = {
    username: '',
    error: null,
    messages: [],
    isConnected: function() {
      return this.username != '';
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

  service.connect = function(username) {
    service.error = null;
    chatSocket = new WS(jsRoutes.controllers.Application.chat(username).webSocketURL());
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
      service.username = username;
      ping = $interval(function() {
        service.send('/ping');
      }, 60000, 0, false);
    });
    chatSocket.onclose = wrap(function() {
      $rootScope.$broadcast('ws:disconnected');
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
    },
    getError: function() {
      return Connection.error;
    },
    connect: Connection.connect,
    disconnect: Connection.disconnect,
    isConnected: Connection.isConnected,
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
