angular.module('filters.weekday', [])

.filter('weekday', function() {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return function(input) {
    return days[input] || '?';
  };
});
