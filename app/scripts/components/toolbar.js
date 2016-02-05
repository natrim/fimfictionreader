/*globals jQuery,Vue,require*/

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
        var sub = jQuery('#subnote');
        var $el = jQuery(this.$el);
        var after = function () {
          if (sub.is(':visible')) {
            var clear = null;
            var close = function () {
              clear = setTimeout(function () {
                clear = null;
                $el.off('mouseout.note');
                sub.off('mouseout.note');
                $el.off('mouseover.note');
                sub.off('mouseover.note');
                sub.find('#location').val(require('browser').getUrl());
                sub.slideUp(400);
              }, 500);
            };
            var stay = function () {
              if (clear) {
                clearTimeout(clear);
                clear = null;
              }
            };
            $el.on('mouseout.note', close);
            sub.on('mouseout.note', close);
            $el.on('mouseover.note', stay);
            sub.on('mouseover.note', stay);

            sub.find('#location').focus().select();
          }
        };
        if (sub.is(':visible')) {
          sub.slideUp(400, after);
        } else {
          sub.slideDown(400, after);
        }
        sub.find('#location').val(require('browser').getUrl());
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
