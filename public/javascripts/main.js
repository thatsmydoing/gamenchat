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
    {partial: 'chatRoom', name: 'Chat'}
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
