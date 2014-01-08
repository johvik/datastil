angular.module('info', ['services.classdata', 'directives.line-chart'], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/list/:id', {
      templateUrl: 'info/info.tpl.html',
      controller: 'InfoCtrl',
      resolve: {
        data: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getData($route.current.params.id).$promise;
          }
        ],
        info: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getInfo($route.current.params.id).$promise;
          }
        ]
      }
    });
  }
]);

angular.module('info').controller('InfoCtrl', ['$scope', '$filter', 'data', 'info',
  function($scope, $filter, data, info) {
    var available = [];
    var waitinglist = [];
    // Convert data to x-y values
    for (var i = 0, j = data.length; i < j; i++) {
      var di = data[i];
      available.push({
        x: di.time,
        y: di.lediga
      });
      waitinglist.push({
        x: di.time,
        y: di.waitinglistsize
      });
    }

    $scope.data = [{
      values: available,
      key: 'Available',
      color: '#1f77b4'
    }, {
      values: waitinglist,
      key: 'Waiting list',
      color: '#d62728'
    }];
    $scope.info = info;

    var dateFilter = $filter('date');
    $scope.xAxisTickFormat = function() {
      return function(d) {
        return dateFilter(d, 'MMM d, HH:mm');
      };
    };

    // End chart at current time
    $scope.forcex = new Date().getTime();
  }
]);
