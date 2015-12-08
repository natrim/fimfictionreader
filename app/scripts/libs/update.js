'use strict';

/*globals chrome*/
/*exported createUpdater*/

var AppUpdaterInstance;

function createUpdater(notificationId) {
  if (AppUpdaterInstance) {
    return AppUpdaterInstance;
  }

  function l(value) {
    return chrome.i18n.getMessage(value);
  }

  function AppUpdater() {
    this.updateID = notificationId;
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

    var updateListener = function updateListener() {
      chrome.runtime.onUpdateAvailable.removeListener(updateListener);
      setTimeout(function delayUpdate() {
        this.checking = false;
        this.update();
      }.bind(this), 1000);
    }.bind(this);
    chrome.runtime.onUpdateAvailable.addListener(updateListener);

    chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status, details) {
      if (status === 'update_available') {
        chrome.notifications.create(this.updateID, {
          type: 'basic',
          iconUrl: 'images/icon-128.png',
          title: l('notificationUpdateAvailable'),
          message: l('notificationUpdateDetail', details.version)
        });
      } else {
        chrome.runtime.onUpdateAvailable.removeListener(updateListener);
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
