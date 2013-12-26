angular.module('info', ['services.classdata'], ['$routeProvider',
  function($routeProvider) {
    $routeProvider.when('/list/:id', {
      templateUrl: 'info/info.tpl.html',
      controller: 'InfoCtrl',
      resolve: {
        data: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getData($route.current.params.id);
          }
        ],
        info: ['$route', 'ClassData',
          function($route, ClassData) {
            return ClassData.getInfo($route.current.params.id);
          }
        ]
      }
    });
  }
]);

angular.module('info').controller('InfoCtrl', ['$scope', '$routeParams', 'data', 'info',
  function($scope, $routeParams, data, info) {
    $scope.data = data;
    $scope.info = info;
  }
]);
