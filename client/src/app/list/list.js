angular.module('list', [
  'services.classes',
  'services.data-storage',
  'directives.group-filter',
  'filters.not-in-array',
  'filters.class-filter',
  'infinite-scroll'
], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/list', {
      templateUrl: 'list/list.tpl.html',
      controller: 'ListCtrl'
    });
  }
]);

angular.module('list').controller('ListCtrl', [
  '$scope',
  '$location',
  'classes',
  'dataStorage',
  function($scope, $location, classes, dataStorage) {
    $scope.$on('window.focus', classes.resetIfOld);
    $scope.$on('window.timer', classes.resetIfOld);
    classes.resetIfOld();

    $scope.classes = classes;

    // Read stored values
    $scope.hiddenGroups = dataStorage.loadHiddenGroups();
    $scope.searchText = dataStorage.loadSearchText();

    $scope.$watch('hiddenGroups', function(newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        // Workaround for initial trigger
        return;
      }
      dataStorage.storeHiddenGroups(newValue);
      // Get next page to make sure loading gets triggered
      classes.nextPage();
    }, true);
    $scope.$watch('searchText', dataStorage.storeSearchText);
  }
]);
