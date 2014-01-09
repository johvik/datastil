angular.module('services.classes', ['ngResource']);
angular.module('services.classes').factory('classes', ['$resource',
  function($resource) {

    var classesService = {};
    var page = 0;
    var pageSize = 50;

    classesService.data = [];
    classesService.pageLoading = false;
    classesService.hasNext = true;

    classesService.nextPage = function() {
      if (classesService.hasNext && !classesService.pageLoading) {
        classesService.pageLoading = true;

        // Get next page
        $resource('/classes/' + (page++) + '?size=' + pageSize).query(function(res) {
          classesService.data = classesService.data.concat(res);

          classesService.pageLoading = false;
          if (res.length < pageSize) {
            // No more when there is less than the requested ammount
            classesService.hasNext = false;
          }
        }, function() {
          // Error, stop loading
          classesService.pageLoading = false;
          classesService.hasNext = false;
        });
      }
    };

    return classesService;
  }
]);
