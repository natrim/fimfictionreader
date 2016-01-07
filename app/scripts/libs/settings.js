/*globals _,chrome,jQuery,Vue,exports,require*/
/*exported createSettings*/

var SettingsInstance;

function createSettings() {
  'use strict';

  if (SettingsInstance) {
    return SettingsInstance;
  }

  var toolbar = require('window');
  var browser = require('browser');
  var update = require('update');
  var AppConfig = AppConfig || require('config');
  var el = document.querySelector('#settings');

  // translate helper
  var l = AppConfig.translate;

  //default settings
  var settings = _.clone(AppConfig.settings);
  //save settings keys for watches
  var settingsKeys = Object.keys(settings);

  var manifest = chrome.runtime.getManifest();
  var settingsType = 'local'; //local or sync
  //if deployed from store then sync settings
  if (manifest.key) {
    settingsType = 'sync';
  }

  var VM;

  function createSettingsInstance(settings) {
    if (VM) {
      return VM;
    }
    VM = new Vue({
      el: el,
      data: {
        settings: settings,
        appVersion: 'v' + manifest.version,
        shortDomainUrl: AppConfig.shortUrl
      },
      methods: {
        reloadApp: function () {
          update.update();
        },
        checkUpdates: function checkUpdates() {
          update.check(true);
        },
        setHome: function (url) {
          this.settings.homePage = url.replace(AppConfig.homeReplacer, '');
        },
        clearBrowser: function clearBrowser() {
          jQuery(this.$el).modal('hide');
          var resetDialog = function resetDialog() {};
          resetDialog.ok = function () {
            browser.getControls().clearData(function (ok) {
              if (ok) {
                window.toastr.success(l('clear_data'), l('ResetData'), {
                  'closeButton': false,
                  'positionClass': 'toast-bottom-left',
                  'timeOut': '5000',
                  'extendedTimeOut': '1000'
                });
              } else {
                window.toastr.error(l('clear_data_fail'), l('ResetData'), {
                  'closeButton': false,
                  'positionClass': 'toast-bottom-left',
                  'timeOut': '5000',
                  'extendedTimeOut': '1000'
                });
              }
            });
            resetDialog.ok = function () {};
            resetDialog.cancel = function () {};
          };
          resetDialog.cancel = function () {
            _.defer(function () {
              //reopen settings
              jQuery(this.$el).modal('show');
            }.bind(this));
            resetDialog.ok = function () {};
            resetDialog.cancel = function () {};
          }.bind(this);
          _.defer(function () {
            window.confirm(l('Confirm'), l('ConfirmResetData'), resetDialog);
          });
        }
      },
      ready: function settingsReady() {
        //settings dialog init
        jQuery(this.$el).modal({
          detachable: false,
          autofocus: false
        });
      }
    });

    return VM;
  }

  function watchSettings(VM) {
    //watch for settings change
    _.each(settingsKeys, function (key) {
      var rollback = false;
      VM.$watch('settings.' + key, function (newVal, oldVal) {
        if (rollback) {
          rollback = false;
          return;
        }
        var set = {};
        set[key] = newVal;
        if (key === 'homePage') {
          set[key] = newVal.replace(AppConfig.homeReplacer, '');
        }
        chrome.storage[settingsType].set(set, function () {
          if (chrome.runtime.lastError) {
            rollback = true;
            settings[key] = oldVal;
            if (key !== 'lastUrl') {
              window.toastr.error(l('SettingsSaveFailed'), l('Settings'), {
                'closeButton': false,
                'positionClass': 'toast-bottom-left',
                'timeOut': '5000',
                'extendedTimeOut': '1000'
              });
            }
          } else if (key !== 'lastUrl') {
            if (key === 'homePage') {
              browser.setHome(AppConfig.url + settings.homePage);
            } else if (key === 'enableShiftToOpenWindow') {
              browser.allowNewWindows(settings.enableShiftToOpenWindow);
            } else if (key === 'toolbarType') {
              if (typeof settings.toolbarType === 'undefined' || parseInt(settings.toolbarType) <= 0 || parseInt(settings.toolbarType) > 2) {
                toolbar.toolbarType = toolbar.isMac ? 1 : 2;
              } else {
                toolbar.toolbarType = parseInt(settings.toolbarType);
              }
            }
            window.toastr.success(l('SettingsSaved'), l('Settings'), {
              'closeButton': false,
              'positionClass': 'toast-bottom-left',
              'timeOut': '3000',
              'extendedTimeOut': '1000'
            });
          }
        });
      });
    });
  }

  function loadSettings() {
    var defer = jQuery.Deferred();

    //needs to create setters and getters or else does not work!
    //Vue makes it for us if we put it as data
    //so component it
    var VM = createSettingsInstance(settings);

    var definer = Object.getOwnPropertyDescriptor(settings, 'toolbarType');
    if (typeof definer.get !== 'function') {
      throw new Error('Vue broken? Settings needs getters set!');
    }

    //load settings
    chrome.storage[settingsType].get(settingsKeys, function getSettings(items) {
      if (!chrome.runtime.lastError) {
        _.each(settingsKeys, function (v) {
          if (typeof items[v] !== 'undefined') {
            settings[v] = items[v];
          }
        });
      }

      //all set watch for changes from now
      watchSettings(VM);

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

      //ok
      defer.resolve(settings);
    });

    return defer.promise();
  }

  function Settings() {
    this.el = el;
  }
  Settings.prototype.load = loadSettings;
  SettingsInstance = new Settings();
  return SettingsInstance;
}

if (typeof exports !== 'undefined') {
  exports.settings = createSettings();
}
