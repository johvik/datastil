angular.module('services.classdata', ['ngResource']);
angular.module('services.classdata').factory('ClassData', ['$resource',
  function($resource) {
    var InfoResource = $resource('/class/:id/info');
    var ScoreInfoResource = $resource('/score/:id');
    var DataResource = $resource('/class/:id');
    var classDataService = {};

    classDataService.getInfo = function(id) {
      return InfoResource.get({
        id: id
      });
    };

    classDataService.getScoreInfo = function(id) {
      return ScoreInfoResource.get({
        id: id
      });
    };

    classDataService.getData = function(id) {
      return DataResource.query({
        id: id
      });
    };

    return classDataService;
  }
]);
