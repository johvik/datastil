angular.module('services.scores', ['ngResource']);
angular.module('services.scores').factory('Scores', ['$resource',
  function($resource) {
    // FIXME Temporary workaround, change to work like classes list
    return $resource('/scores/0?size=10000').query();
  }
]);
