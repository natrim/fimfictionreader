'use strict';

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', ['$scope', '$window', function ($scope, $window) {

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

  $scope.menu = {
    open: false,
    settings: false,
    browser: false
  };

  $scope.openSettings = function () {

  };

  //TODO: online / offline auto mode switch, with confirm?
  //$window.addEventListener('online',  updateOnlineStatus);
  //$window.addEventListener('offline', updateOnlineStatus);
}])

/*
.controller('StoriesCtrl', ['$scope', 'storiesStorage', function ($scope, storiesStorage) {
  storiesStorage.then(function (store) {
    $scope.stories = store.getAll();
  });
}])

.controller('StoryCtrl', ['$scope', '$stateParams', 'storiesStorage', function ($scope, $stateParams, storiesStorage) {
  storiesStorage.then(function (store) {
    $scope.story = store.get(parseInt($stateParams.storyId));
  });
}])
*/

.controller('OnlineCtrl', ['$scope', '$window', '$mdDialog', function ($scope, $window, $mdDialog) {
  var webview = $window.document.getElementById('fimfiction');
  var indicator = $window.document.querySelector('.loading-indicator');
  var loading = document.querySelector('#loading');

  var homeUrl = webview.src;

  var firstLoading = true;
  var webviewLoaded = false;
  webview.addEventListener('loadstart', function () {
    webviewLoaded = false;
    indicator.style.display = 'block';
    if (firstLoading) {
      loading.style.display = 'block';
    }
    $scope.$apply();
  });
  webview.addEventListener('loadstop', function () {
    webviewLoaded = true;
    indicator.style.display = 'none';
    if (firstLoading) {
      loading.style.display = 'none';
      firstLoading = false;
    }
    $scope.$apply();
  });

  $scope.canBack = function () {
    return webviewLoaded && webview.canGoBack();
  };

  $scope.back = function () {
    if (webview.canGoBack()) {
      webview.back();
    }
  };

  $scope.canForward = function () {
    return webviewLoaded && webview.canGoForward();
  };

  $scope.forward = function () {
    if (webview.canGoForward()) {
      webview.forward();
    }
  };

  $scope.canReload = function () {
    return webviewLoaded;
  };

  $scope.reload = function () {
    webview.reload();
  };

  $scope.canHome = function () {
    return webviewLoaded && webview.src !== homeUrl;
  };

  $scope.home = function () {
    webview.src = homeUrl;
  };

  var scrollTop = {
    can: false,
    query: false
  };
  $scope.canTop = function () {
    if (!webviewLoaded || scrollTop.query) {
      return webviewLoaded && scrollTop.can;
    }

    scrollTop.query = true;
    webview.executeScript({
      code: 'window.scrollY'
    }, function (result) {
      if (chrome.runtime.lastError) {
        scrollTop.query = false;
        return;
      }
      if (result && result[0]) {
        if (result[0] > 100) {
          scrollTop.can = true;
          $scope.$apply(); //apply here to prevent loop
          scrollTop.query = false;
          return;
        }
      }

      scrollTop.can = false;
      $scope.$apply(); //apply here to prevent loop
      scrollTop.query = false;
    });

    return webviewLoaded && scrollTop.can;
  };

  $scope.top = function () {
    if (!webviewLoaded) {
      return false;
    }
    var source = 'if(typeof jQuery !== \'undefined\')jQuery(\'html, body\').animate({scrollTop : 0}, 800); else window.scrollTo(0, 0);';
    webview.executeScript({
      code: 'var script=document.createElement(\'script\');script.textContent="' + source + '";(document.head||document.documentElement).appendChild(script);script.parentNode.removeChild(script);'
    });
  };

  $scope.menu.browser = true;

  // fimfiction does not use new windows (only ads), so no handling
  /*webview.addEventListener('newwindow', function (e) {
    if (e.windowOpenDisposition === 'save_to_disk') {
      e.preventDefault();
      $window.open(e.targetUrl); //open in chrome
    } else {
      e.window.discard();
    }
  });*/

  //TODO: catch the request and save to app archive
  webview.addEventListener('permissionrequest', function (e) {
    if (e.permission === 'download' && e.request.url.search('fimfiction.net') !== -1) {
      e.request.allow();
    }
  });

  // capture and handle confirm and alert dialogs
  webview.addEventListener('dialog', function (e) {
    if (e.messageType === 'prompt') {
      console.error('prompt dialog not handled!');
      return;
    }
    e.preventDefault();

    var returnDialog = e.dialog;
    var dialog;
    if (e.messageType === 'confirm') {
      dialog = $mdDialog.confirm({
        title: 'Confirm',
        content: e.messageText,
        ok: 'Ok',
        cancel: 'Cancel'
      });
    } else {
      dialog = $mdDialog.alert({
        title: 'Alert',
        content: e.messageText,
        ok: 'Close'
      });
    }
    $mdDialog
      .show(dialog)
      .then(function () {
        if (returnDialog) {
          if (typeof returnDialog.ok === 'function') {
            returnDialog.ok();
          } else {
            returnDialog.cancel();
          }
          returnDialog = undefined;
        }
      })
      .finally(function () {
        dialog = undefined;
        if (returnDialog) {
          returnDialog.cancel();
          returnDialog = undefined;
        }
      });
  });
}])

;
