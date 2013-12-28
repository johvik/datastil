angular.module('services.data-storage', []);
angular.module('services.data-storage').factory('dataStorage', [

  function() {
    var dataStorageService = {};

    dataStorageService.loadHiddenGroups = function() {
      return JSON.parse(localStorage.getItem('hiddenGroups') || '[]');
    };
    dataStorageService.storeHiddenGroups = function(value) {
      localStorage.setItem('hiddenGroups', JSON.stringify(value));
    };

    dataStorageService.loadSearchText = function() {
      return localStorage.getItem('searchText') || '';
    };
    dataStorageService.storeSearchText = function(value) {
      localStorage.setItem('searchText', value);
    };

    return dataStorageService;
  }
]);
