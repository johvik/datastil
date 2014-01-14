angular.module('services.classes', ['ngResource']);
angular.module('services.classes').factory('classes', ['$resource',
  function($resource) {
    var classesService = {};
    var page = 0;
    var pageSize = 50;
    var firstLoadTime = 0;

    classesService.data = [];
    classesService.pageLoading = false;
    classesService.hasNext = true;

    classesService.resetIfOld = function() {
      if (firstLoadTime === 0 || classesService.pageLoading) {
        return;
      }
      var diff = new Date().getTime() - firstLoadTime;
      if (diff >= 300000) { // 5 min
        // Reset
        page = 0;
        classesService.data = [];
        classesService.hasNext = true;
        classesService.nextPage(); // Trigger first page
      }
    };

    classesService.nextPage = function() {
      if (classesService.hasNext && !classesService.pageLoading) {
        classesService.pageLoading = true;
        if (page === 0) {
          // Save time of first page load
          firstLoadTime = new Date().getTime();
        }

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
