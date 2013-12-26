angular.module('list', ['services.classes', 'directives.group-filter', 'filters.not-in-array', 'infinite-scroll'], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/', {
      templateUrl: 'list/list.tpl.html',
      controller: 'ListCtrl'
    });
  }
]);

angular.module('list').controller('ListCtrl', ['$scope', 'classes',
  function($scope, classes) {
    $scope.classes = classes;
    // Read stored values
    $scope.hiddenGroups = JSON.parse(localStorage.getItem('hiddenGroups') || '[]');
    $scope.$watchCollection('hiddenGroups', function(value) {
      // Store new values
      localStorage.setItem('hiddenGroups', JSON.stringify(value));
      // Get next page to make sure it gets triggered
      classes.nextPage();
    });
  }
]);
