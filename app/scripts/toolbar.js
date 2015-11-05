'use strict';

var appWindow = window.newWindow(window);

//bind content resizing
appWindow.updateContentSize('.window_content', '.window_toolbar');

//fallback closer
var closeTrigger = function closeTrigger() {
  window.close();
};
window.document.querySelector('#default-close-button').addEventListener('click', closeTrigger);

//fire toolbar right away - the DOM should be usable by now
var toolbar = new Vue({
  el: '#toolbar',
  data: {
    appWindow: appWindow
  },
  ready: function toolbarReady() {
    window.document.querySelector('#default-close-button').removeEventListener('click', closeTrigger);
    closeTrigger = null;
  },
  methods: {
    openSettings: function () {
      jQuery('#settingsDialog').modal('toggle');
    }
  }
});

//need to force update
toolbar.$watch('appWindow.isFullscreen', function () {
  appWindow.updateContentSize();
});
