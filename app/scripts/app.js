/*globals _,Vue,VueRouter,jQuery,require*/

Vue.config.debug = true;

function createApp() {
  'use strict';

  // config
  var AppConfig = AppConfig || require('config');
  // update checks
  var update = require('update');
  //schedule startup update check
  _.defer(update.check.bind(update));

  // shortcuts
  var shortcuts = require('shortcuts');

  //load settings and start routing
  require('settings').load().then(function init(settings) {
    //the main component
    var App = Vue.extend({
      ready: function () {
        //bind shortcuts
        shortcuts.bind(settings);
      }
    });

    history.pushState = null; //to prevent warn
    var router = new VueRouter({
      hashbang: false,
      history: false,
      abstract: true
    });
    router.map({
      '/online': {
        component: require('online')(AppConfig, router, settings)
      },
      '/offline': {
        component: require('offline')(AppConfig, router, settings)
      }
    });
    router.start(App, 'body');
    if (navigator.onLine) {
      router.go('/online');
    } else {
      router.go('/offline');
    }
  });
}

//app load
window.addEventListener('load', function appLoad() {
  'use strict';

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
  createApp();
});
