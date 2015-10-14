'use strict';

angular.module('fictionReader.controllers', [])

.controller('AppCtrl', ['$scope', '$window', '$mdToast', '$timeout', 'appWindow', 'appSettings', 'appUpdate', '_', function AppCtrl($scope, $window, $mdToast, $timeout, appWindow, settings, update, _) {

  //bind to resizing the main content to window
  appWindow.bindContent('#main');

  // translations
  $scope.l = function translate(key) {
    return $window.chrome.i18n.getMessage(key);
  };

  // update checks
  update.bind(function updateMsg(details) {
    $mdToast.show($mdToast.simple().position(appWindow.os === 'mac' ? 'top right' : 'top left').hideDelay(0).highlightAction(true).action($scope.l('Restart')).content($scope.l('newVersionAvailable') + ': ' + details.version)).then(function onUpdateAvailableDone(val) {
      if (val === 'ok') {
        update.update();
      }
    });
  });

  //settings
  settings.load();
  settings.saveWithMessage = function saveWithMessage() {
    settings.save(function saveCallback(err) {
      if (err) {
        $mdToast.show($mdToast.simple().hideDelay(8000).content($scope.l('SettingsSaveFailed')).action($scope.l('Close')));
      } else {
        $mdToast.show($mdToast.simple().hideDelay(3000).content($scope.l('SettingsSaved')).action($scope.l('Close')));
      }
    });
  };
  $scope.settings = settings;

  //menu
  $scope.menu = {
    open: false,
    settings: true,
    browser: false
  };

  $scope.menu.toggleHoverMenu = function toggleHoverMenu(open) {
    if ($scope.settings.menuOpenOnHover) {
      $scope.menu.open = open;
    }
  };

  $scope.menu.changeMenuPosition = function changeMenuPositionTrigger(save) {
    var direction;

    if ($window.innerWidth <= 600) {
      direction = $scope.settings.menuPosition.split('-').shift() === 'top' ? 'down' : 'up';
    } else {
      direction = $scope.settings.menuPosition.split('-').pop() === 'left' ? 'right' : 'left';
    }

    if (direction !== $scope.settings.menuOpenDirection) {
      $scope.settings.menuOpenDirection = direction;
      if (save) {
        $scope.settings.save();
      }
    }
  };

  //fire now
  $scope.menu.changeMenuPosition(true);

  $window.addEventListener('resize', _.debounce(function updateMenuPosition() {
    $scope.menu.changeMenuPosition(true);
    $scope.$apply();
  }, 100));

  //TODO: online / offline auto mode switch, with confirm?
  //$window.addEventListener('online',  updateOnlineStatus);
  //$window.addEventListener('offline', updateOnlineStatus);
}])

.controller('ToolbarCtrl', ['$scope', 'appWindow', function ToolbarCtrl($scope, appWindow) {
  $scope.appWindow = appWindow;
  appWindow.addChangeCallback(function () {
    $scope.$apply();
  });
}])

.controller('SettingsCtrl', ['$scope', function SettingsCtrl($scope) {
  $scope.menuPositionPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
}])

.controller('MenuCtrl', ['$scope', '$mdSidenav', '$mdDialog', 'browser', function MenuCtrl($scope, $mdSidenav, $mdDialog, browser) {
  $scope.menu.openSettings = function openSettings() {
    $mdSidenav('settings').toggle();
  };

  $scope.menu.closeSettings = function closeSettings() {
    $mdSidenav('settings').close();
  };

  $scope.menu.browser = browser.getControls();
  $scope.menu.browser.addChangeCallback(function (type) {
    if (type === 'scroll') {
      $scope.$apply();
    }
  });
  $scope.menu.clearBrowserData = function clearBrowserData() {
    $mdDialog.show($mdDialog.confirm({
      title: $scope.l('Confirm'),
      content: $scope.l('ConfirmResetData'),
      ok: $scope.l('Reset'),
      cancel: $scope.l('Cancel')
    })).then(function resetWebDataOk() {
      $scope.menu.browser.clearData(function resetWebDataDone(ok) {
        if (ok) {
          $mdDialog.show($mdDialog.alert({
            title: $scope.l('Alert'),
            content: $scope.l('clear_data'),
            ok: $scope.l('Ok')
          }));
        }
      });
    });
  };
}])

.controller('OnlineCtrl', ['$scope', '$window', '$mdDialog', 'browser', function OnlineCtrl($scope, $window, $mdDialog, browser) {
  browser.bindWebview('#fimfiction');
  browser.setHome('https://www.fimfiction.net/');
  browser.setDomainLimit('fimfiction.net');
  //browser.allowNewWindows(true);
  browser.allowDownloadFrom('fimfiction.net');

  var webviewFirstLoading = true;
  var indicator = $window.document.querySelector('.loading-indicator');
  var loadingWindow = $window.document.querySelector('#loading');
  browser.addChangeCallback(function (type, err) {
    if (type === 'loadstart') {
      if (err) {
        $mdDialog.show($mdDialog.alert({
          title: $scope.l('Alert'),
          content: $scope.l('block_url') + '<br>' + err.message,
          ok: $scope.l('Ok')
        }));
      }
      indicator.style.display = 'block';
      if (webviewFirstLoading) {
        loadingWindow.style.display = 'block';
      }
    } else if (type === 'loadstop') {
      indicator.style.display = 'none';
      if (webviewFirstLoading) {
        webviewFirstLoading = false;
        loadingWindow.style.display = 'none';
      }
    } else if (type === 'newwindow') {
      if (err) {
        $mdDialog.show($mdDialog.alert({
          title: $scope.l('Alert'),
          content: $scope.l('block_window') + '<br>' + err.message,
          ok: $scope.l('Ok')
        }));
      }
    } else if (type === 'dialog') {
      var e = err,
        dialog, returnDialog = e.dialog;
      e.preventDefault(); //block guest process
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
    }

    if (type === 'loadstart' || type === 'loadstop') { //renew the display on start and stop
      $scope.$apply();
    }
  });

  //start the browser loading
  browser.start();

  //show browser controls
  $scope.menu.browser = true;
}])

;
