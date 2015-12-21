'use strict';

/*globals _,Vue,VueRouter,chrome,createSettings,createUpdater,createBrowser,createWindow,createOnlineController*/

function createApp(AppConfig) {
  // update checks
  var update = createUpdater(AppConfig.translate);
  //schedule startup update check
  _.defer(update.check.bind(update));

  //helpers instance
  new Vue({
    el: '#helpers',
    data: {
      controls: createBrowser().getControls()
    }
  });

  //load settings and start routing
  createSettings(AppConfig, createWindow(), createBrowser(), update).load().then(function init(settings) {
    //the main component
    var App = Vue.extend({});

    history.pushState = null; //to prevent warn
    var router = new VueRouter({
      hashbang: false,
      history: false,
      abstract: true
    });
    router.map({
      '/online': {
        component: createOnlineController(AppConfig, settings)
      },
      '/offline': {
        component: {
          template: '<div class="ui modal active visible">' + '<div class="header">' + 'OFFLINE' + '</div>' + '<div class="content">' + AppConfig.translate('offlineDetail') + '<div class="description">' + '</div>' + '</div>' + '</div>',
          ready: function () {
            jQuery('#splash').dimmer('hide').remove();
            var check = setInterval(function checkOnline() {
              if (navigator.onLine) {
                clearInterval(check);
                router.go('/online');
              }
            }, 1000);
          }
        }
      }
    });
    router.start(App, '#app');
    if (navigator.onLine) {
      router.go('/online');
    } else {
      router.go('/offline');
    }
  });
}


window.addEventListener('load', function appLoad() {
  //enable tooltips
  jQuery('[data-content],[data-html]').popup();

  //alert dialog init
  jQuery('#dialog').modal({
    detachable: false,
    autofocus: true
  });

  //set toast's
  window.toastr.options = {
    'closeButton': false,
    'debug': false,
    'newestOnTop': false,
    'progressBar': false,
    'positionClass': 'toast-bottom-left',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': '5000',
    'extendedTimeOut': '1000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
  };

  //load background page and get config
  chrome.runtime.getBackgroundPage(function (win) {
    win.AppConfig.translate = chrome.i18n.getMessage;
    createApp(win.AppConfig);
  });
});
