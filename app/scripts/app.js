'use strict';

//fire toolbar right away - the DOM should be usable by now
new Vue({
  el: '#toolbar',
  data: {
    appWindow: window.newWindow(window)
  }
});


window.addEventListener('load', function () {
  //tooltips
  jQuery('[data-content]').popup();

  //the main app
  new Vue({
    el: '#app',
    ready: function () {
      //remove splash
      document.querySelector('#splash').remove();
    },
    data: {},
    methods: {}
  });
});
