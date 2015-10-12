'use strict';

var homeUrl = 'https://www.fimfiction.net/';
var webviewDomainLimit = 'fimfiction.net';
var webview;
var webviewFirstLoading = true;
var webviewLoaded = false;

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', ['$scope', 'settings', '$window', '$mdToast', '$timeout', function ($scope, settings, $window, $mdToast, $timeout) {
  var updateContentSize = function () {
    var content = $window.document.getElementById('main');
    if (content) {
      content.style.height = $window.document.documentElement.clientHeight + 'px';
      content.style.width = $window.document.documentElement.clientWidth + 'px';
    }
  };

  //fire now
  updateContentSize();

  // translations
  $scope.l = function (key) {
    return $window.chrome.i18n.getMessage(key);
  };

  // update box
  $window.chrome.runtime.onUpdateAvailable.addListener(function (details) {
    $mdToast.show($mdToast.simple().hideDelay(60000).highlightAction(true).action($scope.l('Restart')).content($scope.l('newVersionAvailable') + ': ' + details.version)).then(function (val) {
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

  //settings
  settings.load();
  $scope.settings = settings;

  var resizeTimer = null;
  $window.addEventListener('resize', function () {
    if (resizeTimer) {
      $timeout.cancel(resizeTimer);
      resizeTimer = null;
    }
    resizeTimer = $timeout(function () {
      resizeTimer = null;
      var direction;

      if ($window.innerWidth <= 600) {
        direction = $scope.settings.menuPosition.split('-').shift() === 'top' ? 'down' : 'up';
      } else {
        direction = $scope.settings.menuPosition.split('-').pop() === 'left' ? 'right' : 'left';
      }

      //change menu open direction on small display
      if (direction !== $scope.settings.menuOpenDirection) {
        $scope.settings.menuOpenDirection = direction;
        $scope.settings.save(true);
      }

      //update content size
      updateContentSize();
    }, 10);
  });

  $scope.menu = {
    open: false,
    settings: true,
    browser: false
  };

  $scope.toggleHoverMenu = function (open) {
    if ($scope.settings.menuOpenOnHover) {
      $scope.menu.open = open;
    }
  };

  //TODO: online / offline auto mode switch, with confirm?
  //$window.addEventListener('online',  updateOnlineStatus);
  //$window.addEventListener('offline', updateOnlineStatus);
}])

.controller('ToolbarCtrl', ['$scope', '$window', function ($scope, $window) {
  $scope.os = 'linux';
  $window.chrome.runtime.getPlatformInfo(function (info) {
    $scope.os = info.os;
    $scope.$apply();
  });

  // Make sure we read the initial state as well, since the app might startup as maximized.
  $scope.window = {
    isMinimized: $window.chrome.app.window.current().isMinimized(),
    isMaximized: $window.chrome.app.window.current().isMaximized(),
    isFullscreen: $window.chrome.app.window.current().isFullscreen(),
    isFocused: $window.document.hasFocus()
  };

  var changeWindow = function (focus) {
    $scope.window.isMinimized = $window.chrome.app.window.current().isMinimized();
    $scope.window.isMaximized = $window.chrome.app.window.current().isMaximized();
    $scope.window.isFocused = (typeof focus === 'boolean' ? focus : $window.document.hasFocus());
    $scope.window.isFullscreen = $window.chrome.app.window.current().isFullscreen();
    $scope.$apply();
  };

  $window.chrome.app.window.current().onMaximized.addListener(changeWindow);
  $window.chrome.app.window.current().onMinimized.addListener(changeWindow);
  $window.chrome.app.window.current().onRestored.addListener(changeWindow);
  $window.chrome.app.window.current().onFullscreened.addListener(changeWindow);

  $window.addEventListener('focus', changeWindow.bind(this, true));
  $window.addEventListener('blur', changeWindow.bind(this, false));

  $scope.minimize = function () {
    $window.chrome.app.window.current().minimize();
  };

  $scope.maximize = function () {
    if ($window.chrome.app.window.current().isMaximized()) {
      $window.chrome.app.window.current().restore();
    } else {
      $window.chrome.app.window.current().maximize();
    }
  };

  $scope.close = function () {
    $window.chrome.app.window.current().close();
  };
}])

.controller('SettingsCtrl', ['$scope', '$mdSidenav', '$window', function ($scope, $mdSidenav, $window) {
  $scope.open = function () {
    $mdSidenav('settings').toggle();
  };

  $scope.close = function () {
    $mdSidenav('settings').close();
  };

  $scope.changeMenuPosition = function () {
    if ($window.innerWidth <= 600) {
      $scope.settings.menuOpenDirection = $scope.settings.menuPosition.split('-').shift() === 'top' ? 'down' : 'up';
    } else {
      $scope.settings.menuOpenDirection = $scope.settings.menuPosition.split('-').pop() === 'left' ? 'right' : 'left';
    }
  };

  $scope.menuPositionPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
}])

.controller('MenuCtrl', ['$scope', '$window', '$mdDialog', '$mdSidenav', function ($scope, $window, $mdDialog, $mdSidenav) {
  $scope.openSettings = function () {
    $mdSidenav('settings').toggle();
  };

  $scope.canBack = function () {
    return !webviewFirstLoading && webview.canGoBack();
  };

  $scope.back = function () {
    if (webview.canGoBack()) {
      webview.back();
    }
  };

  $scope.canForward = function () {
    return !webviewFirstLoading && webview.canGoForward();
  };

  $scope.forward = function () {
    if (webview.canGoForward()) {
      webview.forward();
    }
  };

  $scope.canReload = function () {
    return true; //reload anytime
  };

  $scope.reload = function () {
    webview.reload();
  };

  $scope.canHome = function () {
    return !webviewFirstLoading && webview.src !== homeUrl;
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
    })).then(function () {
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

  var scrollTopCan = false;
  $window.addEventListener('message', function () {
    if (event && event.data && event.data.command && event.data.command === 'scroll') {
      //console.log('received scroll: ' + event.data.value);
      if (event.data.value > 100) {
        scrollTopCan = true;
      } else {
        scrollTopCan = false;
      }
      $scope.$apply();
    }
  });
  $scope.canTop = function () {
    return webviewLoaded && scrollTopCan;
  };

  $scope.top = function () {
    if (!webviewLoaded) {
      return false;
    }
    webview.contentWindow.postMessage({
      command: 'scrollTop'
    }, '*');
  };
}])

.controller('OnlineCtrl', ['$scope', '$window', '$mdDialog', function ($scope, $window, $mdDialog) {
  webview = $window.document.getElementById('fimfiction');
  var indicator = $window.document.querySelector('.loading-indicator');
  var loading = document.querySelector('#loading');

  webview.addContentScripts([{
    name: 'rule',
    matches: ['http://*/*', 'https://*/*'],
    js: {
      files: ['scripts/webview_inject.js']
    },
    'run_at': 'document_start'
  }]);

  //TODO: load last url from storage
  //for now go home
  webview.src = homeUrl;

  webview.addEventListener('close', function () {
    webview.src = 'about:blank';
  });
  webview.addEventListener('loadstart', function (e) {
    if (e.isTopLevel && (e.url.search(webviewDomainLimit) === -1 && e.url.search('about:blank') === -1)) {
      webview.stop();
      $mdDialog.show($mdDialog.alert({
        title: $scope.l('Alert'),
        content: $scope.l('block_url') + '<br>' + e.url,
        ok: $scope.l('Ok')
      }));
      return false;
    }

    webviewLoaded = false;
    indicator.style.display = 'block';
    if (webviewFirstLoading) {
      loading.style.display = 'block';
    }
    $scope.$apply();
  });
  webview.addEventListener('loadstop', function () {
    webviewLoaded = true;
    indicator.style.display = 'none';
    if (webviewFirstLoading) {
      loading.style.display = 'none';
      webviewFirstLoading = false;
    }
    $scope.$apply();
  });

  webview.addEventListener('contentload', function () {
    //shake hands to send this app id to web
    var handshake = function (event) {
      if (event && event.data && event.data.command && event.data.command === 'handshakereply') {
        console.log('webview handshake received');
        $window.removeEventListener('message', handshake);
      }
    };
    $window.addEventListener('message', handshake);
    webview.contentWindow.postMessage({
      command: 'handshake'
    }, '*');
  });

  //show browser controls
  $scope.menu.browser = true;

  // fimfiction does not use new windows (only ads), so no handling
  webview.addEventListener('newwindow', function (e) {
    /*if (e.targetUrl.search(webviewDomainLimit) !== -1) {
      e.preventDefault();
      $window.open(e.targetUrl); //open in chrome
    } else*/
    {
      e.window.discard();
      $mdDialog.show($mdDialog.alert({
        title: $scope.l('Alert'),
        content: $scope.l('block_window') + '<br>' + e.targetUrl,
        ok: $scope.l('Ok')
      }));
    }
  });

  //TODO: catch the request and save to app archive
  webview.addEventListener('permissionrequest', function (e) {
    if (e.permission === 'download' && e.request.url.search(webviewDomainLimit) !== -1) {
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

;
