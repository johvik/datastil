angular.module('services.chart-data', []);
angular.module('services.chart-data').factory('chartData', [

  function() {

    var chartDataService = {};

    chartDataService.calc = function(data) {
      var available = [];
      var waitinglist = [];
      var prev = 0;
      // Convert data to x-y values
      for (var i = 0, j = data.length; i < j; i++) {
        var di = data[i];
        available.push({
          x: di.time,
          y: di.lediga
        });
        if (di.waitinglistsize !== 0 ||
          prev !== 0 ||
          (i + 1 < j && data[i + 1].waitinglistsize !== 0)) {
          waitinglist.push({
            x: di.time,
            y: -di.waitinglistsize
          });
        }
        prev = di.waitinglistsize;
      }
      return {
        available: available,
        waitinglist: waitinglist
      };
    };

    return chartDataService;
  }
]);
