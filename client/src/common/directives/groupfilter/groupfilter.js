angular.module('directives.group-filter', ['services.groups'])

// Empty filterVar means that everything is selected.
// A number in the filterVar means that that number should be filtered out.
.directive('groupFilter', ['groups',
  function(groups) {
    var directive = {
      templateUrl: 'directives/groupfilter/groupfilter.tpl.html',
      restrict: 'E',
      replace: true,
      scope: {
        filterVar: '='
      },
      link: function($scope, $element, $attrs) {
        $scope.groups = groups;
        $scope.filterVar = [];
        
        $scope.groupFilterChange = function(groupid) {
          var index = $scope.filterVar.indexOf(groupid);
          if (index >= 0) {
            $scope.filterVar.splice(index, 1);
          } else {
            $scope.filterVar.push(groupid);
          }
        };
      }
    };
    return directive;
  }
]);
