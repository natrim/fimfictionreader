'use strict';

var appWindow = window.newWindow(window);

//bind content resizing
appWindow.updateContentSize('.window_content', '.window_toolbar');

//fire toolbar right away - the DOM should be usable by now
var toolbar = new Vue({
  el: '#toolbar',
  data: {
    appWindow: appWindow
  },
  methods: {
    openSettings: function () {
      jQuery('#settingsDialog').modal('toggle');
    }
  }
});

// force update content size on fullscreen change
toolbar.$watch('appWindow.isFullscreen', function () {
  appWindow.updateContentSize();
});
