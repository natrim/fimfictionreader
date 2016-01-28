/*globals _,chrome,jQuery,exports,require*/
/*exported createSettings*/

var SettingsInstance;

function createSettings() {
  'use strict';

  if (SettingsInstance) {
    return SettingsInstance;
  }

  var toolbar = require('window');
  var browser = require('browser');
  var AppConfig = AppConfig || require('config');

  var manifest = chrome.runtime.getManifest();

  var settingsType = 'local'; //local or sync
  //if deployed from store then sync settings
  if (manifest.key) {
    settingsType = 'sync';
  }

  function Settings() {
    this.settingsType = settingsType;
    this.settingsKeys = [];
  }
  Settings.prototype.load = function loadSettings(settings) {
    this.settingsKeys = Object.keys(settings);
    var defer = jQuery.Deferred();

    //load settings
    chrome.storage[this.settingsType].get(this.settingsKeys, function getSettings(items) {
      if (!chrome.runtime.lastError) {
        _.each(this.settingsKeys, function (v) {
          if (typeof items[v] !== 'undefined') {
            settings[v] = items[v];
          }
        });
      }

      //set toolbar type
      if (typeof toolbar !== 'undefined') {
        if (typeof settings.toolbarType === 'undefined' || parseInt(settings.toolbarType) <= 0 || parseInt(settings.toolbarType) > 2) {
          toolbar.toolbarType = toolbar.isMac ? 1 : 2;
        } else {
          toolbar.toolbarType = parseInt(settings.toolbarType);
        }
      }

      //set home from settings
      if (typeof browser !== 'undefined') {
        browser.setHome(AppConfig.url + settings.homePage);
      }

      defer.resolve();
    }.bind(this));

    return defer.promise();
  };

  Settings.prototype.save = function saveSettings(settings, data) {
    var defer = jQuery.Deferred();

    var set = {};
    set[data.key] = data.newVal;
    if (data.key === 'homePage') {
      set[data.key] = data.newVal.replace(AppConfig.homeReplacer, '');
    }

    chrome.storage[this.settingsType].set(set, function setSettings() {
      if (chrome.runtime.lastError) {
        if (data.key !== 'lastUrl' && data.key !== 'lastUrlChanged') {
          defer.resolve(true, true);
        } else {
          defer.resolve(true, false);
        }
      } else if (data.key !== 'lastUrl' && data.key !== 'lastUrlChanged') {
        if (data.key === 'homePage') {
          browser.setHome(AppConfig.url + settings.homePage);
        } else if (data.key === 'enableShiftToOpenWindow') {
          browser.allowNewWindows(settings.enableShiftToOpenWindow);
        } else if (data.key === 'toolbarType') {
          if (typeof settings.toolbarType === 'undefined' || parseInt(settings.toolbarType) <= 0 || parseInt(settings.toolbarType) > 2) {
            toolbar.toolbarType = toolbar.isMac ? 1 : 2;
          } else {
            toolbar.toolbarType = parseInt(settings.toolbarType);
          }
        }
        defer.resolve(false, true);
      } else {
        defer.resolve(false, false);
      }
    });

    return defer.promise();
  };

  SettingsInstance = new Settings();
  return SettingsInstance;
}

if (typeof exports !== 'undefined') {
  exports.settings = createSettings();
}
