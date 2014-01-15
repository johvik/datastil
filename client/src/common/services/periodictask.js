angular.module('services.periodic-task', []);
angular.module('services.periodic-task').factory('PeriodicTask', ['$window',
  function($window) {
    return function(period, task) {
      var periodicTaskService = {};
      var running = false;
      var interval;

      periodicTaskService.start = function() {
        if (!running) {
          running = true;
          interval = $window.setInterval(task, period);
        }
      };

      periodicTaskService.stop = function() {
        if (running) {
          $window.clearInterval(interval);
          running = false;
        }
      };

      return periodicTaskService;
    };
  }
]);
