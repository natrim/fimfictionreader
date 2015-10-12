'use strict';

angular.module('fictionReader', ['fictionReader.controllers', 'fictionReader.services' /*, 'fictionReader.storiesStorage'*/ , 'ui.router', 'ngMaterial'], ['$provide', function fixHistory($provide) {
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

  /*.state('app.stories', {
    url: '/stories',
    views: {
      'content': {
        templateUrl: 'templates/stories.html',
        controller: 'StoriesCtrl'
      }
    }
  })

  .state('app.story', {
    url: '/stories/:storyId',
    views: {
      'content': {
        templateUrl: 'templates/story.html',
        controller: 'StoryCtrl'
      }
    }
  })
*/

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

  //if (navigator.onLine) {
  $urlRouterProvider.otherwise('/app/online');
  //} else {
  //  $urlRouterProvider.otherwise('/app/stories');
  //}
}]);
