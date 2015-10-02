'use strict';

angular.module('fictionReader', ['fictionReader.controllers', 'fictionReader.storiesStorage', 'ui.router', 'ngMaterial'], function ($provide) {
  // Prevent Angular from sniffing for the history API
  // since it's not supported in packaged apps.
  $provide.decorator('$window', function ($delegate) {
    $delegate.history = null;
    return $delegate;
  });
})

.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .backgroundPalette('grey')
    .primaryPalette('blue-grey')
    .accentPalette('indigo');
})

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    views: {
      'nav': {
        templateUrl: 'templates/nav.html',
        controller: 'AppCtrl'
      },
    }
  })

  .state('app.stories', {
    url: '/stories',
    views: {
      'main': {
        templateUrl: 'templates/stories.html',
        controller: 'StoriesCtrl'
      }
    }
  })

  .state('app.story', {
    url: '/stories/:storyId',
    views: {
      'main': {
        templateUrl: 'templates/story.html',
        controller: 'StoryCtrl'
      }
    }
  })


  .state('app.online', {
    url: '/online',
    views: {
      'main': {
        templateUrl: 'templates/online.html',
        controller: 'OnlineCtrl'
      }
    }
  })

  ;

  if (navigator.onLine) {
    $urlRouterProvider.otherwise('/app/online');
  } else {
    $urlRouterProvider.otherwise('/app/stories');
  }
});
