angular.module('app', [
  'ngRoute',
  'list',
  'info',
  'filters.capitalize',
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

angular.module('app').controller('AppCtrl', ['$scope', '$location',
  function($scope, $location) {
    $scope.$on('$routeChangeError', function() {
      $location.path('/list');
    });
  }
]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'breadcrumbs',
  function($scope, $location, $route, breadcrumbs) {
    $scope.location = $location;
    $scope.breadcrumbs = breadcrumbs;

    $scope.isNavbarActive = function(navBarPath) {
      return navBarPath === breadcrumbs.getFirst().name;
    };
  }
]);
