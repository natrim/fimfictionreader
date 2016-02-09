/*globals jQuery,Vue,require*/

//radial menu component
(function createSubbar() {
  'use strict';

  var browser = require('browser');
  var AppConfig = AppConfig || require('settings');

  Vue.component('app-subbar', {
    template: document.querySelector('#subbarTemplate').import.body,
    data: function () {
      return {
        location: '',
        isOpen: false
      };
    },
    events: {
      'toggle-subbar': function () {
        this.toggle();
      },
      'open-subbar': function () {
        this.show();
      },
      'close-subbar': function () {
        this.hide();
      }
    },
    methods: {
      show: function () {
        jQuery(this.$el).slideDown(100, function () {
          this.isOpen = true;
        }.bind(this));
      },
      hide: function () {
        jQuery(this.$el).slideUp(100, function () {
          this.isOpen = false;
        }.bind(this));
      },
      toggle: function () {
        if (this.isOpen) {
          this.hide();
        } else {
          this.show();
        }
      },
      changeURL: function () {
        browser.getControls().go(AppConfig.url + this.location.replace(AppConfig.homeReplacer, ''));
        this.hide();
      }
    },
    watch: {
      'isOpen': function (newVal) {
        if (newVal) {
          this.location = browser.getUrl();
          jQuery(this.$el).find('input').focus().select();
        }
      }
    },
    ready: function () {
      var timer = null;
      var $el = jQuery(this.$el);
      $el.on('focusout', function () {
        timer = setTimeout(function () {
          timer = null;
          this.hide();
        }.bind(this), 300);
      }.bind(this));
      $el.on('focusin', function () {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }.bind(this));
    }
  });

})();
