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
    this.checking = false;
  }

  AppUpdater.prototype.check = function checkUpdate(isManual) {
    if (this.checking) {
      window.chrome.notifications.create(this.updateID, {
        type: 'basic',
        iconUrl: 'images/icon-128.png',
        title: l('notificationWaitUpdateTitle'),
        message: l('notificationWaitUpdateDetail')
      });
      return;
    }

    this.checking = true;

    window.chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status, details) {
      if (status === 'update_available') {
        window.chrome.runtime.onUpdateAvailable.addListener(function updateListener() {
          this.checking = false;
          this.update();
        }.bind(this));
        window.chrome.notifications.create(this.updateID, {
          type: 'basic',
          iconUrl: 'images/icon-128.png',
          title: l('notificationUpdateAvailable'),
          message: l('notificationUpdateDetail', details.version)
        });
      } else {
        this.checking = false;
        if (isManual) {
          window.chrome.notifications.create(this.updateID, {
            type: 'basic',
            iconUrl: 'images/icon-128.png',
            title: l('notificationNoUpdateTitle'),
            message: l('notificationNoUpdateDetail')
          });
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
