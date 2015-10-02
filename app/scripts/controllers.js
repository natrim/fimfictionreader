'use strict';

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', function ($scope, $window, $timeout) {

  // Make sure we read the initial state as well, since the app might startup as maximized.
  $scope.isMaximized = $window.chrome.app.window.current().isMaximized();
  $scope.isFocused = $window.document.hasFocus();

  $scope.handleWindowEvents = function () {
    // Happens when user uses the window bar or shortcuts to maximize.
    $scope.isMaximized = $window.chrome.app.window.current().isMaximized();
    $scope.isFocused = $window.document.hasFocus();

    // This happens from an event and therefore we need to run $apply to make the UI update.
    $scope.$apply();
  };

  $window.chrome.app.window.current().onMaximized.addListener($scope.handleWindowEvents);
  $window.chrome.app.window.current().onMinimized.addListener($scope.handleWindowEvents);
  $window.chrome.app.window.current().onRestored.addListener($scope.handleWindowEvents);

  $window.addEventListener('focus', $scope.handleWindowEvents);
  $window.addEventListener('blur', $scope.handleWindowEvents);

  $scope.minimize = function () {
    $window.chrome.app.window.current().minimize();
  };

  $scope.maximize = function () {
    $window.chrome.app.window.current().maximize();
  };

  $scope.restore = function () {
    $window.chrome.app.window.current().restore();
  };

  $scope.close = function () {
    $window.chrome.app.window.current().close();
  };

  //translations
  $scope.l = function (key) {
    return $window.chrome.i18n.getMessage(key);
  };


  //TODO: online / offline auto hlasku a prepnuti? pres confirm?
  //$window.addEventListener('online',  updateOnlineStatus);
  //$window.addEventListener('offline', updateOnlineStatus);

  //to make it right size window
  function updateContentSize() {
    var content = $window.document.getElementById('main');
    content.style.height = $window.document.documentElement.clientHeight + 'px';
    content.style.width = $window.document.documentElement.clientWidth + 'px';
  }

  $scope.$on('$viewContentLoaded', updateContentSize);
  var sizeTimer = null;
  $window.onresize = function () {
    if (sizeTimer) {
      $timeout.cancel(sizeTimer);
      sizeTimer = null;
    }
    sizeTimer = $timeout(function () {
      sizeTimer = null;
      updateContentSize();
    }, 10);
  };
})

.controller('StoriesCtrl', function ($scope, storiesStorage) {
  storiesStorage.then(function (store) {
    $scope.stories = store.getAll();
  });
})

.controller('StoryCtrl', function ($scope, $stateParams, storiesStorage) {
  storiesStorage.then(function (store) {
    $scope.story = store.get(parseInt($stateParams.storyId));
  });
})

.controller('OnlineCtrl', function ($scope, $window) {
  var webview = $window.document.getElementById('fimfiction');
  webview.addEventListener('newwindow', function (e) {
    e.preventDefault();
    $window.open(e.targetUrl);
  });
  webview.addEventListener('dialog', function (e) {
    if (e.messageType === 'prompt') {
      console.error('prompt dialog not handled!');
      return;
    }
    e.preventDefault();

    //returnDialog = e.dialog;
    //todo: modal
  });
})

;
