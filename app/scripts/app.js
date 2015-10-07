'use strict';

//to make it right size window
function updateContentSize() {
  var content = window.document.getElementById('main');
  content.style.height = window.document.documentElement.clientHeight + 'px';
  content.style.width = window.document.documentElement.clientWidth + 'px';
}

onload = updateContentSize;
var sizeTimer = null;
window.onresize = function () {
  if (sizeTimer) {
    clearTimeout(sizeTimer);
    sizeTimer = null;
  }
  sizeTimer = setTimeout(function () {
    sizeTimer = null;
    updateContentSize();
  }, 10);
};

angular.module('fictionReader', ['fictionReader.controllers' /*, 'fictionReader.storiesStorage'*/ , 'ui.router', 'ngMaterial'], ['$provide', function ($provide) {
  // Prevent Angular from sniffing for the history API
  // since it's not supported in packaged apps.
  $provide.decorator('$window', ['$delegate', function ($delegate) {
    $delegate.history = null;
    return $delegate;
  }]);
}])

.config(['$mdThemingProvider', function ($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .backgroundPalette('grey')
    .primaryPalette('blue-grey')
    .accentPalette('light-blue')
    .warnPalette('red');
}])

.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
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
