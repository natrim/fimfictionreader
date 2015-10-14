'use strict';

function newSettings(window, _, timeout) {
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

  var useCloud = false;
  var loadDone = false;

  function AppSettings() {
    this.menuPosition = 'bottom-right';
    this.menuOpenDirection = 'left';
    this.menuOpenOnHover = false;
  }

  AppSettings.prototype.load = function loadSettings(callback) {
    window.chrome.storage[useCloud ? 'sync' : 'local'].get('settings', function (items) {
      timeout(function timeoutLoadDone() { //set done in next cycle to prevent imeddiate save
        loadDone = true;
      });

      var error = window.chrome.runtime.lastError;
      if (error) {
        if (callback) {
          callback(error);
        }
        console.log('load settings failed: ' + error.message);
      } else if (items.settings) {
        _.each(items.settings, function (v, k) {
          this[k] = v;
        }, this);
        if (callback) {
          callback(null);
        }
        console.log('load settings');
      }
    }.bind(this));
  };

  AppSettings.prototype.save = function saveSettings(callback) {
    if (loadDone) {
      window.chrome.storage[useCloud ? 'sync' : 'local'].set({
        'settings': _.pick(this, function (v) {
          //save only settings
          return typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number';
        })
      }, function saveSettingsDone() {
        var error = window.chrome.runtime.lastError;
        if (error) {
          if (callback) {
            callback(error);
          }
          console.log('save settings failed: ' + error.message);
        } else {
          if (callback) {
            callback(null);
          }
          console.log('save settings');
        }
      }.bind(this));
    } else {
      if (callback) {
        callback(new Error('Settings are not loaded yet!'));
      }
    }
  };

  return new AppSettings();
}

if (typeof module !== 'undefined') {
  module.export.new = newSettings;
}

if (typeof angular !== 'undefined') {
  angular.module('appSettings', [])
    .factory('appSettings', ['$window', '_', '$timeout', newSettings]);
}
