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

  function loadSettings(settings) {
    var defer = jQuery.Deferred();
    var settingsKeys = Object.keys(settings);

    //load settings
    chrome.storage[settingsType].get(settingsKeys, function getSettings(items) {
      if (!chrome.runtime.lastError) {
        _.each(settingsKeys, function (v) {
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
    });

    return defer.promise();
  }

  function Settings() {}
  Settings.prototype.load = loadSettings;
  SettingsInstance = new Settings();
  return SettingsInstance;
}

if (typeof exports !== 'undefined') {
  exports.settings = createSettings();
}
