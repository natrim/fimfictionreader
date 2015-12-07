'use strict';

/*globals chrome*/
/*exported newUpdater*/

var AppUpdaterInstance;

function newUpdater() {
  if (AppUpdaterInstance) {
    return AppUpdaterInstance;
  }

  function l(value) {
    return chrome.i18n.getMessage(value);
  }

  function AppUpdater() {
    this.updateID = 'fimfiction:update';
    this.checking = false;
  }

  AppUpdater.prototype.check = function checkUpdate(isManual) {
    if (this.checking) {
      chrome.notifications.create(this.updateID, {
        type: 'basic',
        iconUrl: 'images/icon-128.png',
        title: l('notificationWaitUpdateTitle'),
        message: l('notificationWaitUpdateDetail')
      });
      return;
    }

    this.checking = true;

    chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status, details) {
      if (status === 'update_available') {
        chrome.runtime.onUpdateAvailable.addListener(function updateListener() {
          this.checking = false;
          this.update();
        }.bind(this));
        chrome.notifications.create(this.updateID, {
          type: 'basic',
          iconUrl: 'images/icon-128.png',
          title: l('notificationUpdateAvailable'),
          message: l('notificationUpdateDetail', details.version)
        });
      } else {
        this.checking = false;
        if (isManual) {
          chrome.notifications.create(this.updateID, {
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
    chrome.runtime.reload();
  };

  AppUpdaterInstance = new AppUpdater();
  return AppUpdaterInstance;
}
