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
    this.get(this.settingsKeys).then(function getSettings(err, items) {
      if (!err) {
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

    this.set(set).then(function setSettings(err) {
      if (err) {
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

  Settings.prototype.get = function get(what) {
    var defer = jQuery.Deferred();
    chrome.storage[this.settingsType].get(what, function getg(items) {
      var err = chrome.runtime.lastError;
      if (err) {
        defer.resolve(err, items);
      } else {
        defer.resolve(null, items);
      }
    });
    return defer.promise();
  };

  Settings.prototype.set = function set(what) {
    var defer = jQuery.Deferred();
    chrome.storage[this.settingsType].set(what, function setg() {
      var err = chrome.runtime.lastError;
      if (err) {
        defer.resolve(err);
      } else {
        defer.resolve(null);
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
