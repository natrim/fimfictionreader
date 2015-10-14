'use strict';

//underscore.js define
var underscore = angular.module('underscore', []);
underscore.factory('_', ['$window', function ($window) {
  return $window._; //Underscore should be loaded on the page
}]);

//app define
angular.module('fictionReader', ['underscore', 'fictionReader.controllers', 'appWindow', 'appSettings', 'appUpdate', 'browser', 'ui.router', 'ngMaterial'], ['$provide', function fixHistory($provide) {
  // Prevent Angular from sniffing for the history API
  // since it's not supported in packaged apps.
  $provide.decorator('$window', ['$delegate', function ($delegate) {
    $delegate.history = null;
    return $delegate;
  }]);
}])

.config(['$mdThemingProvider', function setTheme($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .backgroundPalette('grey')
    .primaryPalette('blue-grey')
    .accentPalette('light-blue')
    .warnPalette('red');
}])

.config(['$stateProvider', '$urlRouterProvider', function setRoutes($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    views: {
      'main': {
        templateUrl: 'templates/main.html',
        controller: 'AppCtrl'
      },
    }
  })

  .state('app.online', {
    url: '/online',
    views: {
      'content': {
        templateUrl: 'templates/online.html',
        controller: 'OnlineCtrl'
      }
    }
  })

  ;


  $urlRouterProvider.otherwise('/app/online');
}]);
