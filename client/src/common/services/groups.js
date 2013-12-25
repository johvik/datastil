angular.module('services.groups', ['ngResource']);
angular.module('services.groups').factory('groups', ['$resource',
  function($resource) {
    return $resource('/groups').query();
  }
]);
