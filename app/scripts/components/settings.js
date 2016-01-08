/*globals chrome,_,jQuery,Vue,require*/

//radial menu component
(function createSettings() {
  'use strict';

  var AppConfig = AppConfig || require('config');
  var toolbar = require('window');
  var browser = require('browser');
  var update = require('update');
  var manifest = chrome.runtime.getManifest();
  var l = AppConfig.translate;

  var settingsType = 'local'; //local or sync
  //if deployed from store then sync settings
  if (manifest.key) {
    settingsType = 'sync';
  }

  Vue.component('app-settings', {
    template: document.querySelector('#settingsTemplate').import.body,
    props: {
      settings: {
        type: Object,
        required: true
      }
    },
    data: function () {
      return {
        appVersion: 'v' + manifest.version,
        shortDomainUrl: AppConfig.shortUrl,
        browser: browser
      };
    },
    events: {
      'toggle-settings': function () {
        jQuery(this.$el).modal('toggle');
      },
      'open-settings': function () {
        jQuery(this.$el).modal('hide');
      },
      'close-settings': function () {
        jQuery(this.$el).modal('show');
      }
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

      var settings = this.settings;

      //watch for settings change
      _.each(Object.keys(settings), function (key) {
        var rollback = false;
        this.$watch('settings.' + key, function (newVal, oldVal) {
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
      }.bind(this));
    }
  });
})();
