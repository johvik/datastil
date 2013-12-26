angular.module('filters.capitalize', [])

.filter('capitalize', function() {
  return function(input) {
    if (typeof input !== 'string') {
      return input;
    }
    return input.charAt(0).toUpperCase() + input.slice(1);
  };
});
