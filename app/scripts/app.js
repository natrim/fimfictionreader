'use strict';

var appWindow = window.newWindow(window);

var closeTrigger = function(){
  window.close();
};

window.document.querySelector('#default-close-button').addEventListener('click', closeTrigger);

//fire toolbar right away - the DOM should be usable by now
new Vue({
  el: '#toolbar',
  data: {
    appWindow: appWindow
  },
  ready: function() {
    window.document.querySelector('#default-close-button').removeEventListener('click', closeTrigger);
    closeTrigger = null;
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
      jQuery('#splash').dimmer('hide');
    },
    data: {},
    methods: {}
  });
});
