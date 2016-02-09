/*globals _,Vue,VueRouter,jQuery,require*/


// common helpers set
window.addEventListener('load', function appLoad() {
  'use strict';

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

  // update check
  setTimeout(function () {
    require('update').check();
  }, 5000);
});

(function createApp() {
  'use strict';

  // config
  var AppConfig = AppConfig || require('appConfig');

  //default settings
  var settings = _.clone(AppConfig.settings);

  //the main component
  var App = Vue.extend({
    data: function () {
      return {
        settings: settings
      };
    },
    ready: function () {
      //bind shortcuts
      require('shortcuts').start(this);
      //global tooltips
      jQuery('[data-content],[data-html]').popup();
    }
  });

  //to prevent warn
  history.pushState = null;

  //router
  var router = new VueRouter({
    hashbang: false,
    history: false,
    abstract: true
  });

  //nav
  router.map({
    '/online': {
      component: require('online').create(router, settings)
    },
    '/offline': {
      component: require('offline').create(router, settings)
    }
  });

  //start app when settings loaded
  require('settings').load(settings).then(function () {
    //start app
    router.start(App, '#app');

    //goto right page
    if (navigator.onLine) {
      router.go('/online');
    } else {
      router.go('/offline');
    }
  });
})();
