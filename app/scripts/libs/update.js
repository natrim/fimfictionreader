'use strict';

function newUpdater(window, _, timeout) {
  if (typeof _ === 'undefined') { //try global
    if (typeof window._ === 'undefined') {
      throw new Error('Missing underscore.js!');
    } else {
      _ = window._;
    }
  }

  if (typeof timeout === 'undefined') {
    timeout = function timeout(callback, timer) {
      if (timer) {
        return _.delay(callback, timer);
      } else {
        return _.defer(callback);
      }
    };

    timeout.prototype.clear = function clearTimeout(ret) {
      return clearTimeout(ret);
    };
  }

  function AppUpdater() {
    this.updateTime = 60000 * 60 * 2; //every two hours
    this.timer = null;
    this.checkUpdate = null;
  }

  AppUpdater.prototype.bind = function bindUpdater(callback) {
    window.chrome.runtime.onUpdateAvailable.addListener(callback);

    if (this.timer) {
      timeout.clear(this.timer);
      this.timer = null;
    }
    this.checkUpdate = function checkUpdate() {
      this.timer = null;
      window.chrome.runtime.requestUpdateCheck(function requestUpdateCheck(status) {
        if (status === 'update_available') {
          console.log('update pending...');
          //stop checking we just need to wait for user to close the app
          return;
        }
        console.log('no update found');
        this.timer = timeout(this.checkUpdate, this.updateTime);
      }.bind(this));
    }.bind(this);

    //check update right now (almost)
    this.timer = timeout(this.checkUpdate, 5000);
  };

  AppUpdater.prototype.update = function update() {
    window.chrome.runtime.reload();
  };

  return new AppUpdater();
}


if (typeof module !== 'undefined') {
  module.export.new = newUpdater;
}
