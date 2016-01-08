/*globals _,Vue,require*/

//radial menu component
(function createRadialMenu() {
  'use strict';

  var controls = require('browser').getControls();
  Vue.component('app-radial-menu', {
    template: document.querySelector('#radialTemplate').import.body,
    data: function () {
      return {
        controls: controls
      };
    },
    ready: function () {
      //radial menu
      window.radialMenu(this.$el, _.throttle(function (callback) {
        controls.check(); //sync func
        if (callback) {
          callback();
        }
      }, 100));
    }
  });
})();
