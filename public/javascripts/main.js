if(window.location.hostname == 'gamenchat.pleasantprogrammer.com' && window.location.port != 8000) {
  window.location = 'http://gamenchat.pleasantprogrammer.com:8000';
}

angular.module('taboo', ['chatServices', 'tabooServices'])

function partial(template) {
  return jsRoutes.controllers.Assets.at('partials/'+template+'.html').url;
}

function ViewCtrl($scope, Connection) {
  $scope.service = Connection;
  $scope.partial = partial;
  $scope.view = 'about';

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

function LoginCtrl($scope, Chat) {
  $scope.service = Chat;
}

function ChatCtrl($scope, Chat) {
  $scope.service = Chat;

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

function ContributeCtrl($scope, $http) {
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
        alert("Thank you for your contribution!");
        init();
        $('#inputWord').focus();
      });
  }

  init();
}
