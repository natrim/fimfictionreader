'use strict';

var homeUrl = 'https://www.fimfiction.net/';
var webviewDomainLimit = 'fimfiction.net';
var webview;
var webviewFirstLoading = true;
var webviewLoaded = false;

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', ['$scope', 'settings', '$window', '$mdToast', '$timeout', 'appWindow', '_', function AppCtrl($scope, settings, $window, $mdToast, $timeout, appWindow, _) {

  //bind to resizing the main content to window
  appWindow.updateContentSize('#main');

  // translations
  $scope.l = function translate(key) {
    return $window.chrome.i18n.getMessage(key);
  };

  // update box
  $window.chrome.runtime.onUpdateAvailable.addListener(function onUpdateAvailable(details) {
    $mdToast.show($mdToast.simple().hideDelay(60000).highlightAction(true).action($scope.l('Restart')).content($scope.l('newVersionAvailable') + ': ' + details.version)).then(function onUpdateAvailableDone(val) {
      if (val === 'ok') {
        $window.chrome.runtime.reload();
      }
    });
  });

  var updateTime = 60000 * 60 * 2; //every two hours
  var checkUpdate = function checkUpdate() {
    $window.chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status) {
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

  var updateMenuPosition = function updateMenuPosition() {
    var direction;

    if ($window.innerWidth <= 600) {
      direction = $scope.settings.menuPosition.split('-').shift() === 'top' ? 'down' : 'up';
    } else {
      direction = $scope.settings.menuPosition.split('-').pop() === 'left' ? 'right' : 'left';
    }

    if (direction !== $scope.settings.menuOpenDirection) {
      $scope.settings.menuOpenDirection = direction;
      $scope.settings.save(true);
    }
  };

  //fire now
  updateMenuPosition();
  $window.addEventListener('resize', _.debounce(updateMenuPosition, 100));

  $scope.menu = {
    open: false,
    settings: true,
    browser: false
  };

  $scope.toggleHoverMenu = function toggleHoverMenu(open) {
    if ($scope.settings.menuOpenOnHover) {
      $scope.menu.open = open;
    }
  };

  //TODO: online / offline auto mode switch, with confirm?
  //$window.addEventListener('online',  updateOnlineStatus);
  //$window.addEventListener('offline', updateOnlineStatus);
}])

.controller('ToolbarCtrl', ['$scope', 'appWindow', function ToolbarCtrl($scope, appWindow) {
  $scope.os = 'linux';
  appWindow.window.chrome.runtime.getPlatformInfo(function getPlatformInfo(info) {
    $scope.os = info.os;
    $scope.$apply();
  });

  $scope.appWindow = appWindow;
  appWindow.addCallback(function () {
    $scope.$apply();
  });
}])

.controller('SettingsCtrl', ['$scope', '$mdSidenav', '$window', function SettingsCtrl($scope, $mdSidenav, $window) {
  $scope.open = function openSettings() {
    $mdSidenav('settings').toggle();
  };

  $scope.close = function closeSettings() {
    $mdSidenav('settings').close();
  };

  $scope.changeMenuPosition = function changeMenuPositionTrigger() {
    if ($window.innerWidth <= 600) {
      $scope.settings.menuOpenDirection = $scope.settings.menuPosition.split('-').shift() === 'top' ? 'down' : 'up';
    } else {
      $scope.settings.menuOpenDirection = $scope.settings.menuPosition.split('-').pop() === 'left' ? 'right' : 'left';
    }
  };

  $scope.menuPositionPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
}])

.controller('MenuCtrl', ['$scope', '$window', '$mdDialog', '$mdSidenav', function MenuCtrl($scope, $window, $mdDialog, $mdSidenav) {
  $scope.openSettings = function openSettings() {
    $mdSidenav('settings').toggle();
  };

  $scope.canBack = function canGoBack() {
    return !webviewFirstLoading && webview.canGoBack();
  };

  $scope.back = function goBack() {
    if (webview.canGoBack()) {
      webview.back();
    }
  };

  $scope.canForward = function canGoForward() {
    return !webviewFirstLoading && webview.canGoForward();
  };

  $scope.forward = function goForward() {
    if (webview.canGoForward()) {
      webview.forward();
    }
  };

  $scope.canReload = function canReloadPage() {
    return true; //reload anytime
  };

  $scope.reload = function reloadPage() {
    webview.reload();
  };

  $scope.canHome = function canGoHome() {
    return !webviewFirstLoading && webview.src !== homeUrl;
  };

  $scope.home = function goHome() {
    webview.src = homeUrl;
  };

  $scope.resetWebData = function resetWebData() {
    $mdDialog.show($mdDialog.confirm({
      title: $scope.l('Confirm'),
      content: $scope.l('ConfirmResetData'),
      ok: $scope.l('Reset'),
      cancel: $scope.l('Cancel')
    })).then(function resetWebDataOk() {
      webview.clearData({}, {
        'appcache': true,
        'cookies': true
      }, function resetWebDataDone() {
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
  $window.addEventListener('message', function onMessage() {
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
  $scope.canTop = function canGoTop() {
    return webviewLoaded && scrollTopCan;
  };

  $scope.top = function goTop() {
    if (!webviewLoaded) {
      return false;
    }
    webview.contentWindow.postMessage({
      command: 'scrollTop'
    }, '*');
  };
}])

.controller('OnlineCtrl', ['$scope', '$window', '$mdDialog', function OnlineCtrl($scope, $window, $mdDialog) {
  webview = $window.document.getElementById('fimfiction');
  var indicator = $window.document.querySelector('.loading-indicator');
  var loading = $window.document.querySelector('#loading');

  webview.addContentScripts([{
    name: 'rule',
    matches: ['http://*/*', 'https://*/*'],
    js: {
      files: ['scripts/inject/init.js', 'scripts/inject/scroll.js']
    },
    'run_at': 'document_start'
  }]);

  //TODO: load last url from storage
  //for now go home
  webview.src = homeUrl;

  webview.addEventListener('close', function onCloseWebview() {
    webview.src = 'about:blank';
  });
  webview.addEventListener('loadstart', function onStartWebview(e) {
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
  webview.addEventListener('loadstop', function onStopWebview() {
    webviewLoaded = true;
    indicator.style.display = 'none';
    if (webviewFirstLoading) {
      loading.style.display = 'none';
      webviewFirstLoading = false;
    }
    $scope.$apply();
  });

  webview.addEventListener('contentload', function onLoadWebview() {
    //shake hands to send this app id to web
    var handshake = function handshake(event) {
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
  webview.addEventListener('newwindow', function onNewWindowWebview(e) {
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
  webview.addEventListener('permissionrequest', function onPermissionWebview(e) {
    if (e.permission === 'download' && e.request.url.search(webviewDomainLimit) !== -1) {
      e.request.allow();
    }
  });

  // capture and handle confirm and alert dialogs
  webview.addEventListener('dialog', function onDialogWebview(e) {
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
      .then(function dialogDone() {
        if (returnDialog) {
          if (typeof returnDialog.ok === 'function') {
            returnDialog.ok();
          } else {
            returnDialog.cancel();
          }
          returnDialog = undefined;
        }
      })
      .finally(function dialogGone() {
        dialog = undefined;
        if (returnDialog) {
          returnDialog.cancel();
          returnDialog = undefined;
        }
      });
  });
}])

;
