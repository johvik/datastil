angular.module('services.classes', ['ngResource']);
angular.module('services.classes').factory('classes', ['$resource',
  function($resource) {

    var classesService = {};
    var page = 0;

    classesService.data = [];
    classesService.pageLoading = false;
    classesService.hasNext = true;

    classesService.nextPage = function() {
      classesService.pageLoading = true;

      // Get next page
      $resource('/classes/' + page++).query(function(res) {
        classesService.data = classesService.data.concat(res);

        classesService.pageLoading = false;
        if (res.length < 20) {
          // 20 elements per page
          classesService.hasNext = false;
        }
      }, function() {
        // Error, stop loading
        classesService.pageLoading = false;
        classesService.hasNext = false;
      });
    };

    return classesService;
  }
]);
