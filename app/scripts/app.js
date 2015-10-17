'use strict';

var appWindow = window.newWindow(window);

appWindow.updateContentSize('.window_content', '.window_toolbar');

var closeTrigger = function () {
  window.close();
};

window.document.querySelector('#default-close-button').addEventListener('click', closeTrigger);

//fire toolbar right away - the DOM should be usable by now
new Vue({
  el: '#toolbar',
  data: {
    appWindow: appWindow
  },
  ready: function () {
    window.document.querySelector('#default-close-button').removeEventListener('click', closeTrigger);
    closeTrigger = null;
  }
});

function l(value) {
  return window.chrome.i18n.getMessage(value);
}

window.addEventListener('load', function () {
  //tooltips
  jQuery('[data-content]').popup();

  //set toast's
  window.toastr.options = {
    'closeButton': true,
    'debug': false,
    'newestOnTop': false,
    'progressBar': true,
    'positionClass': 'toast-top-right',
    'preventDuplicates': true,
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

  // update checks
  var update = window.newUpdater(window);

  update.bind(function updateMsg(details) {
    window.toastr.info(l('Update'), l('newVersion') + ': ' + details.version, {
      'closeButton': true,
      'onclick': update.update.bind(update),
      'positionClass': 'toast-top-' + (appWindow.isMac ? 'right' : 'left'),
      'timeOut': '60000',
      'extendedTimeOut': '30000'
    });
  });

  //browser
  var browser = window.newBrowser(window);

  browser.bindWebview('#fimfiction');
  browser.setHome('https://www.fimfiction.net/');
  browser.setDomainLimit('fimfiction.net');
  //browser.allowNewWindows(true);
  browser.allowDownloadFrom('fimfiction.net');

  //the main app
  new Vue({
    el: '#app',
    ready: function () {
      var loading = jQuery('#loading');
      var loadingBrowserTimer = null;
      loading.attr('v-cloak', null); //enable - manually cause it's outside of app
      var firstBrowserLoad = true;
      var firstLoadBrowserTimer = null;
      browser.addChangeCallback(function (type, err, e) {
        //show small circle to indicate page loading
        if (e.isTopLevel && type === 'loadstart') {
          loading.addClass('active');
          loadingBrowserTimer = window._.delay(function () {
            loadingBrowserTimer = null;
            loading.removeClass('active');
          }, 5000);
        } else if (type === 'loadstop') {
          if (loadingBrowserTimer) {
            clearTimeout(loadingBrowserTimer);
            loadingBrowserTimer = null;
            loading.removeClass('active');
          }
        }

        if (firstBrowserLoad && type === 'loadstart') {
          //remove splash on first load
          firstLoadBrowserTimer = window._.delay(function () {
            firstLoadBrowserTimer = null;
            firstBrowserLoad = false;
            jQuery('#splash').dimmer('hide').remove();
          }, 5000);
        } else if (firstBrowserLoad && type === 'loadstop') {
          if (firstLoadBrowserTimer) {
            clearTimeout(firstLoadBrowserTimer);
            firstLoadBrowserTimer = null;
            jQuery('#splash').dimmer('hide').remove();
          }
          firstBrowserLoad = false;
        }
      });
      //start the browser loading
      browser.start();
    },
    data: {},
    methods: {}
  });
});
