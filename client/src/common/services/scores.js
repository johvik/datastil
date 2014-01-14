angular.module('services.scores', ['ngResource']);
angular.module('services.scores').factory('scores', ['$resource',
  function($resource) {
    var scoresService = {};
    var page = 0;
    var pageSize = 50;
    var firstLoadTime = 0;

    scoresService.data = [];
    scoresService.pageLoading = false;
    scoresService.hasNext = true;

    scoresService.resetIfOld = function() {
      if (firstLoadTime === 0 || scoresService.pageLoading) {
        return;
      }
      var diff = new Date().getTime() - firstLoadTime;
      if (diff >= 300000) { // 5 min
        // Reset
        page = 0;
        scoresService.data = [];
        scoresService.hasNext = true;
      }
    };

    scoresService.nextPage = function() {
      if (scoresService.hasNext && !scoresService.pageLoading) {
        scoresService.pageLoading = true;
        if (page === 0) {
          // Save time of first page load
          firstLoadTime = new Date().getTime();
        }

        // Get next page
        $resource('/scores/' + (page++) + '?size=' + pageSize).query(function(res) {
          scoresService.data = scoresService.data.concat(res);

          scoresService.pageLoading = false;
          if (res.length < pageSize) {
            // No more when there is less than the requested ammount
            scoresService.hasNext = false;
          }
        }, function() {
          // Error, stop loading
          scoresService.pageLoading = false;
          scoresService.hasNext = false;
        });
      }
    };

    return scoresService;
  }
]);
