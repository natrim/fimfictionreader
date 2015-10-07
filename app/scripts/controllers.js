'use strict';

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', ['$scope', '$window', '$mdToast', '$timeout', function ($scope, $window, $mdToast, $timeout) {
  $scope.os = 'linux';
  $window.chrome.runtime.getPlatformInfo(function (info) {
    $scope.os = info.os;
    $scope.$apply();
  });

  // translations
  $scope.l = function (key) {
    return $window.chrome.i18n.getMessage(key);
  };

  // update box
  $window.chrome.runtime.onUpdateAvailable.addListener(function (details) {
    $mdToast.show($mdToast.simple().hideDelay(60000).highlightAction(true).action($scope.l('Restart')).content($scope.l('newVersionAvailable') + details.version)).then(function (val) {
      if (val === 'ok') {
        $window.chrome.runtime.reload();
      }
    });
  });

  var updateTime = 60000 * 60 * 2; //every two hours
  var checkUpdate = function () {
    $window.chrome.runtime.requestUpdateCheck(function (status) {
      if (status === 'update_available') {
        console.log('update pending...');
        //stop checking we just need to wait for user to close the app
        //$timeout(checkUpdate, updateTime);
      } else if (status === 'no_update') {
        console.log('no update found');
        $timeout(checkUpdate, updateTime);
      } else if (status === 'throttled') {
        console.log('wait more time for update...');
        updateTime += (60000 * 5); //add five minutes to check
        $timeout(checkUpdate, updateTime);
      }
    });
  };

  //check update right now (almost)
  $timeout(checkUpdate, 5000);

  // Make sure we read the initial state as well, since the app might startup as maximized.
  $scope.isMaximized = $window.chrome.app.window.current().isMaximized();
  $scope.isFocused = $window.document.hasFocus();

  var maximize = function () {
    $scope.isMaximized = $window.chrome.app.window.current().isMaximized();
    $scope.$apply();
  };

  $window.chrome.app.window.current().onMaximized.addListener(maximize);
  $window.chrome.app.window.current().onMinimized.addListener(maximize);
  $window.chrome.app.window.current().onRestored.addListener(maximize);

  var focus = function (focus) {
    $scope.isFocused = typeof focus === 'boolean' ? focus : $window.document.hasFocus();
    $scope.$apply();
  };
  $window.addEventListener('focus', focus.bind(null, true));
  $window.addEventListener('blur', focus.bind(null, false));

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

  var homeUrl = 'https://www.fimfiction.net/';

  //TODO: load last url from storage
  //for now go home
  webview.src = homeUrl;

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
    return !firstLoading && webview.canGoBack();
  };

  $scope.back = function () {
    if (webview.canGoBack()) {
      webview.back();
    }
  };

  $scope.canForward = function () {
    return !firstLoading && webview.canGoForward();
  };

  $scope.forward = function () {
    if (webview.canGoForward()) {
      webview.forward();
    }
  };

  $scope.canReload = function () {
    return !firstLoading;
  };

  $scope.reload = function () {
    webview.reload();
  };

  $scope.canHome = function () {
    return !firstLoading && webview.src !== homeUrl;
  };

  $scope.home = function () {
    webview.src = homeUrl;
  };

  $scope.resetWebData = function () {
    $mdDialog.show($mdDialog.confirm({
      title: $scope.l('Confirm'),
      content: $scope.l('ConfirmResetData'),
      ok: $scope.l('Reset'),
      cancel: $scope.l('Cancel')
    })).then(function() {
      webview.clearData({}, {
        'appcache': true,
        'cookies': true
      }, function () {
        $mdDialog.show($mdDialog.alert({
          title: $scope.l('Alert'),
          content: $scope.l('clear_data'),
          ok: $scope.l('Ok')
        }));
        $scope.home();
      });
    });
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
    e.preventDefault();

    var returnDialog = e.dialog;
    var dialog;
    if (e.messageType === 'confirm') {
      dialog = $mdDialog.confirm({
        title: $scope.l('Confirm'),
        content: e.messageText,
        ok: $scope.l('Ok'),
        cancel: $scope.l('Cancel')
      });
    } else if (e.messageType === 'prompt') {
      /*dialog = $mdDialog.prompt({
        title: $scope.l('Prompt'),
        content: e.messageText,
        ok: $scope.l('Ok'),
        cancel: $scope.l('Cancel')
      });*/
      dialog = $mdDialog.alert({
        title: $scope.l('Alert'),
        content: 'Prompt dialog not handled, yet!',
        ok: $scope.l('Close')
      });
    } else {
      dialog = $mdDialog.alert({
        title: $scope.l('Alert'),
        content: e.messageText,
        ok: $scope.l('Close')
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
