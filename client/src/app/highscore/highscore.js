angular.module('highscore', [
  'services.scores',
  'services.data-storage',
  'directives.group-filter',
  'filters.not-in-array',
  'filters.class-filter',
  'infinite-scroll'
], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/highscore', {
      templateUrl: 'highscore/highscore.tpl.html',
      controller: 'HighscoreCtrl'
    });
  }
]);

angular.module('highscore').controller('HighscoreCtrl', ['$scope', '$location', 'scores', 'dataStorage',
  function($scope, $location, scores, dataStorage) {
    $scope.scores = scores;

    // Read stored values
    $scope.hiddenGroups = dataStorage.loadHiddenGroups();
    $scope.searchText = dataStorage.loadSearchText();

    $scope.$watchCollection('hiddenGroups', function(value) {
      dataStorage.storeHiddenGroups(value);
      // Get next page to make sure loading gets triggered
      scores.nextPage();
    });
    $scope.$watch('searchText', dataStorage.storeSearchText);
  }
]);
