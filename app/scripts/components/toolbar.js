/*globals Vue,require*/

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
        this.$root.$broadcast('toggle-subbar');
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
