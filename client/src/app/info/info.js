angular.module('info', ['services.classdata', 'nvd3ChartDirectives'], ['$routeProvider',
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

angular.module('info').controller('InfoCtrl', ['$scope', '$routeParams', '$filter', 'data', 'info',
  function($scope, $routeParams, $filter, data, info) {
    $scope.data = [{
      values: data
    }];
    $scope.info = info;

    $scope.xFunction = function() {
      return function(d) {
        return d.time;
      };
    };
    $scope.yFunction = function() {
      return function(d) {
        return d.bokningsbara - d.waitinglistsize;
      };
    };

    var dateFilter = $filter('date');
    $scope.xAxisTickFormat = function() {
      return function(d) {
        return dateFilter(d, 'MMM d, HH:mm');
      };
    };
    $scope.yAxisTickFormat = function() {
      return function(d) {
        return d;
      };
    };

    // End chart at current time
    $scope.forcex = new Date().getTime();
  }
]);
