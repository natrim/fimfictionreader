/*globals jQuery,exports,require*/
/*exported createOfflineController*/

function createOfflineController(router) {
  'use strict';
  var AppConfig = AppConfig || require('config');
  var l = AppConfig.translate;
  var check;
  return {
    template: '<div class="ui modal active visible">' + '<div class="header">' + 'OFFLINE' + '</div>' + '<div class="content">' + '<div class="description">' + l('offlineDetail') + '</div>' + '</div>' + '</div>',
    destroyed: function destroydOffline() {
      if (check) {
        clearInterval(check);
        check = undefined;
      }
    },
    ready: function offlineReady() {
      jQuery('#splash').dimmer('hide').remove();
      check = setInterval(function checkOnline() {
        if (navigator.onLine) {
          clearInterval(check);
          check = undefined;
          router.go('/online');
        }
      }, 1000);
    }
  };
}

if (typeof exports !== 'undefined') {
  exports.offline = {
    create: createOfflineController
  };
}
