angular.module('services.notification', []).factory('notification', ['$rootScope',
  function($rootScope) {

    var notificationService = {};

    notificationService.text = '';

    notificationService.dismiss = function() {
      notificationService.text = '';
    };

    $rootScope.$on('$routeChangeSuccess', function() {
      notificationService.dismiss();
    });

    return notificationService;
  }
]);
