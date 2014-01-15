angular.module('app', [
  'ngRoute',
  'list',
  'info',
  'highscore',
  'score-info',
  'filters.capitalize',
  'services.breadcrumbs',
  'services.notification',
  'services.periodic-task',
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

angular.module('app').controller('AppCtrl', [
  '$rootScope',
  '$scope',
  '$window',
  'notification',
  'PeriodicTask',
  function($rootScope, $scope, $window, notification, PeriodicTask) {
    // Start a task
    var periodicTask = new PeriodicTask(60000, function() {
      $rootScope.$broadcast('window.timer');
    });
    $window.onfocus = function() {
      $rootScope.$broadcast('window.focus');
      // Restart after blur
      periodicTask.start();
    };
    // Don't run when page is inactive
    $window.onblur = periodicTask.stop;

    periodicTask.start();

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
