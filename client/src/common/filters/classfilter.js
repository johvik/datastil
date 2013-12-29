angular.module('filters.class-filter', [])

.filter('classFilter', ['$filter',
  function($filter) {
    var dateFilter = $filter('date');
    // Returns true if obj matches text
    var match = function(obj, text) {
      if (obj.aktivitet) {
        if (('' + obj.aktivitet).toLowerCase().indexOf(text) !== -1) {
          return true;
        }
      }
      if (obj.resurs) {
        if (('' + obj.resurs).toLowerCase().indexOf(text) !== -1) {
          return true;
        }
      }
      if (obj.lokal) {
        if (('' + obj.lokal).toLowerCase().indexOf(text) !== -1) {
          return true;
        }
      }
      if ('startTime' in obj) {
        if (dateFilter(obj.startTime, 'HH:mm, EEEE, MMM d').toLowerCase().indexOf(text) !== -1) {
          return true;
        }
      } else {
        // Don't use both startTime + time and day
        if (obj.time) { // time is a string
          if (('' + obj.time).toLowerCase().indexOf(text) !== -1) {
            return true;
          }
        }
        if ('day' in obj) {
          var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          var day = days[obj.day];
          if (day && day.indexOf(text) !== -1) {
            return true;
          }
        }
      }
      return false;
    };

    return function(items, text) {
      if (!angular.isArray(items) || !text) {
        return items;
      }
      // Ignore case
      text = ('' + text).toLowerCase();
      var filtered = [];
      for (var i = 0, j = items.length; i < j; i++) {
        var item = items[i];
        if (match(item, text)) {
          filtered.push(item);
        }
      }
      return filtered;
    };
  }
]);
