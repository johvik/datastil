angular.module('filters.not-in-array', [])

.filter('notInArray', function() {
  return function(items, array, field) {
    if(!array) {
      return items;
    }
    var filtered = [];
    angular.forEach(items, function(item) {
      if (array.indexOf(item[field] || item) === -1) {
        // Add when not in array
        filtered.push(item);
      }
    });
    return filtered;
  };
});