angular.module('app', [
  'ngRoute',
  'list',
  'info',
  'highscore',
  'score-info',
  'filters.capitalize',
  'services.breadcrumbs',
  'services.notification',
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

angular.module('app').controller('AppCtrl', ['$scope', 'notification',
  function($scope, notification) {
    $scope.notification = notification;

    $scope.$on('$routeChangeError', function(angularEvent, current, previous, rejection) {
      if (rejection && rejection.status === 404) {
        notification.text = 'Page not found.';
      } else {
        notification.text = 'Something went wrong =(';
      }
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
