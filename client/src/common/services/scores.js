angular.module('services.scores', ['ngResource']);
angular.module('services.scores').factory('Scores', ['$resource',
  function($resource) {
    return $resource('/scores').query();
  }
]);
