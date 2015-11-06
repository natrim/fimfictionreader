'use strict';

function newUpdater(window, l) {
  if (typeof l === 'undefined') { //try global
    if (typeof window.l === 'undefined') {
      throw new Error('Missing translate!');
    } else {
      l = window.l;
    }
  }


  function AppUpdater() {
    this.updateID = 'fimfiction:update';
  }

  AppUpdater.prototype.check = function checkUpdate(isManual) {
    //code to enable update checking

    window.chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status, details) {
      if (status === 'update_available') {
        var updateListener = function updateListener() {
          window.chrome.runtime.onUpdateAvailable.removeListener(updateListener);
          window.chrome.notifications.clear(this.updateID, function clearNotifications() {
            window.chrome.notifications.create(this.updateID, {
              type: 'basic',
              iconUrl: 'images/icon-128.png',
              title: l('notificationUpdateAvailable'),
              message: l('notificationUpdateDetail', details.version),
              buttons: [
                {
                  title: l('notificationUpdateOK')
                },
                {
                  title: l('notificationUpdateWait')
                }
              ]
            }, function (id) {
              this.updateID = id;
            }.bind(this));
            var notificationListener = function notificationListener(id, index) {
              if (id !== this.updateID) {
                return;
              }
              window.chrome.notifications.onButtonClicked.removeListener(notificationListener);
              if (index === 0) {
                this.update();
              }
            }.bind(this);
            window.chrome.notifications.onButtonClicked.addListener(notificationListener);
          }.bind(this));
        }.bind(this);
        window.chrome.runtime.onUpdateAvailable.addListener(updateListener);
      } else {
        if (isManual) {
          window.chrome.notifications.clear(this.updateID, function clearNotifications() {
            window.chrome.notifications.create(this.updateID, {
              type: 'basic',
              iconUrl: 'images/icon-128.png',
              title: l('notificationNoUpdateTitle'),
              message: l('notificationNoUpdateDetail')
            }, function (id) {
              this.updateID = id;
            }.bind(this));
          }.bind(this));
        }
      }

    }.bind(this));
  };

  AppUpdater.prototype.update = function update() {
    window.chrome.runtime.reload();
  };

  return new AppUpdater();
}


if (typeof module !== 'undefined') {
  module.export.new = newUpdater;
}
