angular.module('app', [
  'ngRoute',
  'list',
  'info',
  'services.breadcrumbs',
  'templates.app',
  'templates.common'
]);

angular.module('app').config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.otherwise({
      redirectTo: '/list'
    });
  }
]);

angular.module('app').controller('AppCtrl', ['$scope',
  function($scope) {}
]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'breadcrumbs',
  function($scope, $location, $route, breadcrumbs) {
    $scope.location = $location;

    $scope.isNavbarActive = function(navBarPath) {
      return navBarPath === breadcrumbs.getFirst().name;
    };
  }
]);
