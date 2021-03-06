if(window.location.hostname == 'gamenchat.pleasantprogrammer.com' && window.location.port == "8000") {
  window.location = 'http://gamenchat.pleasantprogrammer.com';
}

angular.module('taboo', ['chatServices', 'tabooServices'])

function resizeMessages() {
  $("#messages").css('height', $(window).height() - 300);
}

window.onresize = resizeMessages;

function partial(template) {
  return jsRoutes.controllers.Assets.at('partials/'+template+'.html').url;
}

function ViewCtrl($scope, $location, Connection) {
  $scope.service = Connection;
  $scope.partial = partial;
  $scope.view = 'about';

  if($location.path() && $(window).width() >= 768) {
    $scope.view = 'chatRoom';
  }

  $scope.nav = [
    {partial: 'about', name: 'About'},
    {partial: 'chatRoom', name: 'Chat'},
    {partial: 'contribute', name: 'Contribute'}
  ];

  $scope.setView = function(p) {
    $scope.view = p;
  }

  $scope.$on('ws:connected', function() {
    $scope.view = 'chatRoom';
  });
}

function LoginCtrl($scope, Connection) {
  $scope.service = Connection;
}

function ChatCtrl($scope, Chat, Connection, $timeout) {
  $scope.service = Connection;
  $scope.chat = Chat;

  resizeMessages();
  var scrollLock = true;

  $scope.onType = function(event) {
    if($scope.text != '' && event.keyCode == 13) {
      scrollLock = true;
      Chat.send($scope.text);
      $scope.text = '';
      event.originalEvent.preventDefault();
    }
  }

  function scroll() {
    var actualHeight = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(actualHeight);
  }

  $("#messages").scroll(function() {
    var maxScroll = this.scrollHeight - $(this).height();
    scrollLock = (this.scrollTop == maxScroll);
  });

  $scope.$on('chat:message', function() {
    if(scrollLock) $timeout(scroll, 100)
  });
}

function GameCtrl($scope, Taboo) {
  $scope.game = Taboo;
}

function ContributeCtrl($scope, $http, $timeout) {
  $scope.submitting = false;
  $scope.exists = false;

  function init() {
    $scope.card = {
      word: '',
      taboos: []
    };
  }

  function check() {
    $http.get(jsRoutes.controllers.Cards.exists($scope.card.word).url)
      .then(function(data) {
        $scope.exists = data.data.exists;
      });
  }

  var promise = null;

  $scope.check = function() {
    if(promise != null) {
      $timeout.cancel(promise);
    }
    promise = $timeout(check, 200);
  }

  $scope.submit = function() {
    if($scope.submitting) return;
    $scope.submitting = true;
    $http.post(jsRoutes.controllers.Cards.add().url, $scope.card)
      .then(function() {
        $scope.submitting = false;
        $scope.thanks = true;
        $timeout(function() {
          $scope.thanks = false;
        }, 3000);
        init();
        $('#inputWord').focus();
      });
  }

  init();
}
