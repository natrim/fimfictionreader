'use strict';

//listen for commands
chrome.commands.onCommand.addListener(function (command) {
  var window = chrome.app.window.get('main').contentWindow;
  var $scope = window.angular.element(window.document.querySelector('md-fab-actions')).scope();
  if ($scope) {
    switch (command) {
    case 'app-settings':
      $scope.menu.openSettings();
      break;
    case 'browser-top':
      if ($scope.menu.browser.canTop()) {
        $scope.menu.browser.top();
      }
      break;
    case 'browser-back':
      if ($scope.menu.browser.canBack()) {
        $scope.menu.browser.back();
      }
      break;
    case 'browser-forward':
      if ($scope.menu.browser.canForward()) {
        $scope.menu.browser.forward();
      }
      break;
    case 'browser-reload':
      if ($scope.menu.browser.canReload()) {
        $scope.menu.browser.reload();
      }
      break;
    case 'browser-home':
      if ($scope.menu.browser.canHome()) {
        $scope.menu.browser.home();
      }
      break;
    default:
      console.error('failed to get command!');
    }
  } else {
    console.error('failed to load menu scope!');
  }
});

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
