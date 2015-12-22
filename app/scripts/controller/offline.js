'use strict';

/*globals Vue,jQuery*/
/*exported createOfflineController*/

function createOfflineController(AppConfig, router) {
  var l = AppConfig.translate;
  return Vue.extend({
    template: '<div class="ui modal active visible">' + '<div class="header">' + 'OFFLINE' + '</div>' + '<div class="content">' + '<div class="description">' + l('offlineDetail') + '</div>' + '</div>' + '</div>',
    ready: function offlineReady() {
      jQuery('#splash').dimmer('hide').remove();
      var check = setInterval(function checkOnline() {
        if (navigator.onLine) {
          clearInterval(check);
          router.go('/online');
        }
      }, 1000);
    }
  });
}