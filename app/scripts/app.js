'use strict';

/*globals _,AppConfig,Vue,VueRouter,jQuery,createSettings,createUpdater,createBrowser,createWindow,createShortcuts,createOnlineController,createOfflineController*/

function createApp(AppConfig) {
  // update checks
  var update = createUpdater(AppConfig.translate);
  //schedule startup update check
  _.defer(update.check.bind(update));

  //browser
  var browser = createBrowser();
  var controls = browser.getControls();
  // shortcuts
  var shortcuts = createShortcuts(AppConfig.translate, AppConfig.findSelector);
  // toolbar
  var toolbar = createWindow();

  //helpers instance (modal,radial)
  new Vue({
    el: '#helpers',
    data: {
      controls: controls
    }
  });

  //load settings and start routing
  createSettings(AppConfig, toolbar, browser, update).load().then(function init(settings) {
    _.defer(function done() {
      //bind shortcuts
      shortcuts.bind(settings, browser, toolbar);

      //radial menu
      window.radialMenu(_.throttle(function (callback) {
        controls.check(); //sync func
        if (callback) {
          callback();
        }
      }, 100));
    });

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
        component: createOnlineController(AppConfig, router, settings)
      },
      '/offline': {
        component: createOfflineController(AppConfig, router, settings)
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

//app load
window.addEventListener('load', function appLoad() {
  //enable tooltips
  jQuery('[data-content],[data-html]').popup();

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

  //get config and load page
  if (typeof AppConfig === 'object') {
    createApp(AppConfig);
  } else {
    jQuery('#splash').dimmer('hide').remove();
    jQuery('#app').append('<div class="ui modal active visible">' + '<div class="header">' + 'LOAD FAILURE' + '</div>' + '<div class="content">' + '<div class="description">No app config provided!</div>' + '</div>' + '</div>');
  }
});
