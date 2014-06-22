angular.module('history', [
  'services.scores',
  'services.data-storage',
  'directives.group-filter',
  'filters.not-in-array',
  'filters.class-filter',
  'infinite-scroll'
], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/history', {
      templateUrl: 'history/history.tpl.html',
      controller: 'HistoryCtrl'
    });
  }
]);

angular.module('history').controller('HistoryCtrl', [
  '$scope',
  '$location',
  'scores',
  'dataStorage',
  function($scope, $location, scores, dataStorage) {
    $scope.$on('window.focus', scores.resetIfOld);
    $scope.$on('window.timer', scores.resetIfOld);
    scores.resetIfOld();

    $scope.scores = scores;

    // Read stored values
    $scope.hiddenGroups = dataStorage.loadHiddenGroups();
    $scope.searchText = dataStorage.loadSearchText();

    $scope.$watch('hiddenGroups', function(newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        // Workaround for initial trigger
        return;
      }
      dataStorage.storeHiddenGroups(newValue);

      if ($scope.scoresFiltered.length <= $scope.tableLimit) {
        // Get next page to make sure loading gets triggered
        scores.nextPage();
      }
    }, true);
    $scope.$watch('searchText', dataStorage.storeSearchText);
  }
]);
