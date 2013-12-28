if(window.location.hostname == 'gamenchat.pleasantprogrammer.com' && window.location.port != 8000) {
  window.location = 'http://gamenchat.pleasantprogrammer.com:8000';
}

angular.module('taboo', ['chatServices', 'tabooServices'])

function partial(template) {
  return jsRoutes.controllers.Assets.at('partials/'+template+'.html').url;
}

function ViewCtrl($scope, $location, Connection) {
  $scope.service = Connection;
  $scope.partial = partial;
  $scope.view = 'about';

  if($location.path()) {
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

function ChatCtrl($scope, Chat, Connection) {
  $scope.service = Connection;
  $scope.chat = Chat;

  $scope.onType = function(event) {
    if(event.keyCode == 13) {
      Chat.send($scope.text);
      $scope.text = '';
      event.originalEvent.preventDefault();
    }
  }
}

function GameCtrl($scope, Taboo) {
  $scope.game = Taboo;
}

function ContributeCtrl($scope, $http, $timeout) {
  $scope.submitting = false;

  function init() {
    $scope.card = {
      word: '',
      taboos: []
    };
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
