angular.module('tabooServices', [])
.factory('Taboo', function($rootScope, Chat) {
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
  game.pass = function() {
    Chat.send('/pass');
  };
  game.roundStart = function() {
    game.pendingRound = false;
    game.startTime = new Date();
    game.points = 0;
  };
  game.roundEnd = function() {
    game.pendingRound = false;
    game.card = null;
    game.monitors = [];
  };
  game.isMonitor = function() {
    return game.monitors.indexOf(Chat.username) >= 0;
  };
  game.isPlayer = function() {
    return game.player == Chat.username;
  };

  $rootScope.$on('ws:connected', init);
  $rootScope.$on('ws:message', onmessage);

  function init() {
    game.teamA = null;
    game.teamB = null;
    game.card = null;
    game.points = 0;
    game.pendingRound = false;
    game.player = '';
    game.monitors = [];
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
      game.points = message.points;
    }
    else if(message.kind == "roundReady") {
      gmMessage("Next round, the player will be "+message.player);
      if(message.player == Chat.username) {
        game.pendingRound = true;
      }
    }
    else if(message.kind == "roundStart") {
      gmMessage("Start game!");
      game.roundStart();
      game.player = message.round.team.player;
      game.monitors = message.round.monitors;
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
  }

  function gmMessage(message) {
    Chat.receive("gm", "*GM", message);
  }

  return game;
})
