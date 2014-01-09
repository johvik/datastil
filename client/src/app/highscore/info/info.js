// More or less copy-paste of list/info
angular.module('score-info', ['services.classdata', 'services.chart-data', 'directives.line-chart'], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/highscore/:id', {
      templateUrl: 'highscore/info/info.tpl.html',
      controller: 'ScoreInfoCtrl',
      resolve: {
        data: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getData($route.current.params.id).$promise;
          }
        ],
        info: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getScoreInfo($route.current.params.id).$promise;
          }
        ]
      }
    });
  }
]);

angular.module('score-info').controller('ScoreInfoCtrl', ['$scope', '$filter', 'chartData', 'data', 'info',
  function($scope, $filter, chartData, data, info) {
    var d = chartData.calc(data);

    $scope.data = [{
      values: d.available,
      key: 'Available',
      color: '#1f77b4'
    }];
    // Only show waitinglist if there is any!
    if (d.waitinglist.length > 0) {
      $scope.data.push({
        values: d.waitinglist,
        key: 'Waiting list',
        color: '#d62728'
      });
    }
    $scope.info = info;

    var dateFilter = $filter('date');
    $scope.xAxisTickFormat = function() {
      return function(d) {
        return dateFilter(d, 'MMM d, HH:mm');
      };
    };

    $scope.forcey = [0];
  }
]);
