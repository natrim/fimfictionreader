'use strict';

angular.module('fictionReader.services', [])

.factory('settings', ['$window', '$mdToast', '$timeout', '_',
  function SettingsFactory($window, $mdToast, $timeout, _) {
    var useCloud = false;

    function Settings() {
      this.menuPosition = 'bottom-right';
      this.menuOpenDirection = 'left';
      this.menuOpenOnHover = false;
    }

    var loadDone = false;
    Settings.prototype.load = function loadSettings() {
      $window.chrome.storage[useCloud ? 'sync' : 'local'].get('settings', function (items) {
        $timeout(function timeoutLoad() { //set done in next cycle to prevent imeddiate save
          loadDone = true;
        });

        var error = $window.chrome.runtime.lastError;
        if (error) {
          console.log('load settings failed: ' + error.message);
        } else if (items.settings) {
          console.log('load settings');
          _.each(items.settings, function (v, k) {
            this[k] = v;
          }, this);
        }
      }.bind(this));
    };

    Settings.prototype.save = function saveSettings(skipMessage) {
      skipMessage = skipMessage || false;
      if (loadDone) {
        $window.chrome.storage[useCloud ? 'sync' : 'local'].set({
          'settings': _.pick(this, function (v) {
            //save only settings
            return typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number';
          })
        }, function saveSettingsDone() {
          var error = $window.chrome.runtime.lastError;
          if (error) {
            if (!skipMessage) {
              $mdToast.show($mdToast.simple().hideDelay(8000).content($window.chrome.i18n.getMessage('SettingsSaveFailed')).action($window.chrome.i18n.getMessage('Close')));
            }
            console.log('save settings failed: ' + error.message);
          } else {
            if (!skipMessage) {
              $mdToast.show($mdToast.simple().content($window.chrome.i18n.getMessage('SettingsSaved')).action($window.chrome.i18n.getMessage('Close')));
            }
            console.log('save settings');
          }
        }.bind(this));
      }
    };

    return new Settings();
  }
])

;
