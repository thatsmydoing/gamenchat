angular.module('tabooServices', [])
.factory('Timer', function($interval) {
  var promise;
  var service = {
    count: 0,
    endTime: 0,
    remainingTime: function() {
      var ms = service.endTime - new Date().getTime();
      return Math.round(Math.max(0, ms) / 1000);
    },
    start: function(duration) {
      if(service.remainingTime() > 0) $interval.cancel(promise);
      var now = new Date().getTime();
      service.endTime = now + duration * 1000;
      service.count = duration;
      promise = $interval(function() {
        service.count = service.remainingTime();
      }, 1000, duration);
    }
  }
  return service;
})
.factory('Taboo', function($rootScope, Chat, Timer) {
  var game = {};
  game.startRound = function() {
    Chat.send('/start');
  };
  game.status = function() {
    Chat.send('/status');
  };
  game.taboo = function() {
    Chat.send('/taboo');
  };
  game.correct = function() {
    Chat.send('/correct');
  };
  game.pass = function() {
    Chat.send('/pass');
  };
  game.roundStart = function(round) {
    game.pendingRound = false;
    game.round = round;
    game.points = 0;
    Timer.start(game.round.remainingTime);
  };
  game.roundEnd = function() {
    game.pendingRound = false;
    game.round = null;
    game.card = null;
  };
  game.isMonitor = function() {
    return game.round.monitors.indexOf(Chat.username) >= 0;
  };
  game.isPlayer = function() {
    return game.round.team.player == Chat.username;
  };
  game.roundRunning = function() {
    return game.round != null;
  }

  $rootScope.$on('ws:connected', init);
  $rootScope.$on('ws:message', onmessage);

  function init() {
    game.teamA = null;
    game.teamB = null;
    game.card = null;
    game.points = 0;
    game.pendingRound = false;
    game.roundStarted = false;
    game.round = null;
    game.timer = Timer;
    game.status();
  }

  if(Chat.isConnected()) {
    init();
  }

  function onmessage(event, message) {
    if(message.kind == "point") {
      var text = "";

      if(message.action == "correct") {
        text = message.user + " got it!";
      }
      else if(message.action == "correctp") {
        text = "Let's take "+message.user+"'s word that someone got it.";
      }
      else if(message.action == "invalid") {
        text = "Uh-uh! You said a taboo word.";
      }
      else if(message.action == "pass") {
        text = "Tsk tsk. "+game.round.team.player+" passed.";
      }
      else if(message.action == "taboo") {
        text = "Oh no! "+message.user+" has called "+game.round.team.player+" out.";
      }

      text += " The last word was "+message.card.word+".";
      gmMessage(text);
      game.points = message.points;
    }
    else if(message.kind == "abuse") {
      var text = "";

      if(message.action == "correctp") {
        text = message.user+" is abusing the correct button. Nobody has even tried to guess yet.";
      }
      else if(message.action == "taboo") {
        text = message.user+" is abusing the taboo button. "+game.round.team.player+" hasn't even said anything yet.";
      }

      gmMessage(text);
    }
    else if(message.kind == "roundReady") {
      gmMessage("Next round, the player will be "+message.player);
      if(message.player == Chat.username) {
        game.pendingRound = true;
      }
    }
    else if(message.kind == "roundStart") {
      gmMessage("Start game!");
      game.roundStart(message.round);
    }
    else if(message.kind == "roundEnd") {
      if(message.card) {
        gmMessage("Time's up! The last word was "+message.card.word+".");
      }
      gmMessage("The round has ended. The team got "+message.points+".");
      game.roundEnd();
    }
    else if(message.kind == "card") {
      game.card = message.card;
    }
    else if(message.kind == "status" || message.kind == "join" || message.kind == "quit") {
      updateStatus(message);
    }
  }

  function updateStatus(message) {
    game.teamA = message.teamA;
    game.teamB = message.teamB;
    game.round = message.round;
    game.pendingRound = (message.pendingPlayer == Chat.username);
    if(game.round) {
      Timer.start(game.round.remainingTime);
    }
  }

  function gmMessage(message) {
    Chat.receive("gm", "*GM", message);
  }

  return game;
});
