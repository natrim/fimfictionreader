/*globals _,Vue,require*/

//radial menu component
(function createRadialMenu() {
  'use strict';

  var controls = require('browser').getControls();
  Vue.component('app-radial-menu', {
    template: '<ul>' + '<li>' + '<a v-on:click="controls.reload()" v-bind:class="{disabled: !controls.isReload}" title="ReloadMore" v-l="title">' + '<l>Reload</l>' + '</a>' + '</li>' + '<li>' + '<a v-on:click="controls.back()" v-bind:class="{disabled: !controls.isBack}" title="BackMore" v-l="title">' + '<l>Back</l>' + '</a>' + '</li>' + '<li>' + '<a v-on:click="controls.home()" v-bind:class="{disabled: !controls.isHome}" title="HomeMore" v-l="title">' + '<l>Home</l>' + '</a>' + '</li>' + '<li>' + '<a v-on:click="controls.top()" v-bind:class="{disabled: !controls.isTop}" title="TopMore" v-l="title">' + '<l>Top</l>' + '</a>' + '</li>' + '<li>' + '<a v-on:click="controls.forward()" v-bind:class="{disabled: !controls.isForward}" title="ForwardMore" v-l="title">' + '<l>Forward</l>' + '</a>' + '</li>' + '</ul>',
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
