'use strict';

/*globals chrome*/
/*exported createUpdater*/

var AppUpdaterInstance;

function createUpdater(l) {
  if (AppUpdaterInstance) {
    return AppUpdaterInstance;
  }

  function AppUpdater() {
    this.checking = false;
  }

  AppUpdater.prototype.check = function checkUpdate(isManual) {
    if (this.checking) {
      window.toastr.warning(l('notificationWaitUpdateDetail'), l('notificationWaitUpdateTitle'), {
        'closeButton': false,
        'positionClass': 'toast-top-right',
        'timeOut': '4000',
        'extendedTimeOut': '1000'
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
        window.toastr.success(l('notificationUpdateDetail', [details.version]), l('notificationUpdateAvailable'), {
          'closeButton': false,
          'positionClass': 'toast-top-right',
          'timeOut': '5000',
          'extendedTimeOut': '1000'
        });
      } else {
        chrome.runtime.onUpdateAvailable.removeListener(updateListener);
        this.checking = false;
        if (isManual) {
          window.toastr.error(l('notificationNoUpdateDetail'), l('notificationNoUpdateTitle'), {
            'closeButton': false,
            'positionClass': 'toast-top-right',
            'timeOut': '5000',
            'extendedTimeOut': '1000'
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
