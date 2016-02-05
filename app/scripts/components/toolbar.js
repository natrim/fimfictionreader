/*globals Vue,require,AppConfig*/

//radial menu component
(function createToolbar() {
  'use strict';

  Vue.component('app-toolbar', {
    template: document.querySelector('#toolbarTemplate').import.body,
    data: function () {
      return {
        appWindow: require('window')
      };
    },
    methods: {
      openSettings: function () {
        this.$root.$broadcast('toggle-settings');
      },
      openGoToURL: function () {
        var dialog = {
          ok: function (result) {
            require('browser').getControls().go(AppConfig.url + result.replace(AppConfig.homeReplacer, ''));
            this.ok = function () {};
            this.cancel = function () {};
          },
          cancel: function () {
            this.ok = function () {};
            this.cancel = function () {};
          }
        };
        window.prompt(AppConfig.translate('Prompt'), AppConfig.translate('goToUrlDialog') + ':', dialog);
      },
      maximizeOrFullscreen: function (event) {
        if (event.shiftKey) {
          this.appWindow.fullscreen();
        } else {
          this.appWindow.maximize();
        }
      }
    },
    ready: function () {
      this.appWindow.updateContentSize('.window_content', '.window_toolbar');
    },
    watch: {
      'appWindow.isFullscreen': function () {
        this.appWindow.updateContentSize();
      }
    }
  });
})();
