angular.module('list', ['services.classes', 'infinite-scroll'], ['$routeProvider', function($routeProvider){
  $routeProvider.when('/', {
    templateUrl:'list/list.tpl.html',
    controller:'ListCtrl'
  });
}]);

angular.module('list').controller('ListCtrl', ['$scope', 'classes', function($scope, classes) {
  $scope.classes = classes;
}]);