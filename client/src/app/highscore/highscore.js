angular.module('highscore', ['services.scores',
  'services.data-storage',
  'directives.group-filter',
  'filters.not-in-array',
  'filters.weekday',
  'filters.class-filter'
], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/highscore', {
      templateUrl: 'highscore/highscore.tpl.html',
      controller: 'HighscoreCtrl',
      resolve: {
        scores: ['Scores',
          function(Scores) {
            return Scores.$promise;
          }
        ]
      }
    });
  }
]);

angular.module('highscore').controller('HighscoreCtrl', ['$scope', '$location', 'scores', 'dataStorage',
  function($scope, $location, scores, dataStorage) {
    $scope.scores = scores;

    // Read stored values
    $scope.hiddenGroups = dataStorage.loadHiddenGroups();
    $scope.searchText = dataStorage.loadSearchText();

    $scope.$watchCollection('hiddenGroups', dataStorage.storeHiddenGroups);
    $scope.$watch('searchText', dataStorage.storeSearchText);
  }
]);
