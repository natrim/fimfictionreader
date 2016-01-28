/*globals chrome,_,jQuery,Vue,require*/

//radial menu component
(function createSettings() {
  'use strict';

  var AppConfig = AppConfig || require('config');
  var browser = require('browser');
  var update = require('update');
  var Settings = require('settings');
  var l = AppConfig.translate;

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
        appVersion: 'v' + chrome.runtime.getManifest().version,
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

      //watch for settings change
      _.each(Settings.settingsKeys, function (key) {
        var rollback = false;
        this.$watch('settings.' + key, function (newVal, oldVal) {
          if (rollback) {
            return;
          }
          Settings.save(this.settings, {
            key: key,
            newVal: newVal,
            oldVal: oldVal
          }).then(function (err, report) {
            if (err && report) {
              window.toastr.error(l('SettingsSaveFailed'), l('Settings'), {
                'closeButton': false,
                'positionClass': 'toast-bottom-left',
                'timeOut': '5000',
                'extendedTimeOut': '1000'
              });
            } else if (err) {
              rollback = true;
              this.settings[key] = oldVal;
              Vue.nextTick(function () {
                rollback = false;
              });
            } else if (report) {
              window.toastr.success(l('SettingsSaved'), l('Settings'), {
                'closeButton': false,
                'positionClass': 'toast-bottom-left',
                'timeOut': '3000',
                'extendedTimeOut': '1000'
              });
            }
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }
  });
})();
