/*globals jQuery,Vue,require*/

//radial menu component
(function createToolbar() {
  'use strict';

  Vue.component('app-toolbar', {
    template: '#toolbarTemplate',
    replace: false,
    data: function () {
      return {
        appWindow: require('window')
      };
    },
    methods: {
      openSettings: function () {
        jQuery(require('settings').el).modal('toggle');
      },
      maximize: function (event) {
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
