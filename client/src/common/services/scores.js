angular.module('services.scores', ['ngResource']);
angular.module('services.scores').factory('scores', ['$resource',
  function($resource) {
    var scoresService = {};
    var page = 0;
    var pageSize = 50;

    scoresService.data = [];
    scoresService.pageLoading = false;
    scoresService.hasNext = true;

    scoresService.nextPage = function() {
      if (scoresService.hasNext && !scoresService.pageLoading) {
        scoresService.pageLoading = true;

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
