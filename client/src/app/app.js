angular.module('app', [
  'ngRoute',
  'list',
  'services.breadcrumbs',
  'templates.app',
  'templates.common'
]);

angular.module('app').config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.otherwise({
      redirectTo: '/'
    });
  }
]);

angular.module('app').run([
  function() {}
]);

angular.module('app').controller('AppCtrl', ['$scope',
  function($scope) {}
]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'breadcrumbs',
  function($scope, $location, $route, breadcrumbs) {
    $scope.location = $location;

    $scope.home = function() {
      $location.path('/');
    };

    $scope.isNavbarActive = function(navBarPath) {
      var name = breadcrumbs.getFirst().name;
      if (name === '') {
        name = 'list';
      }
      return navBarPath === name;
    };
  }
]);
