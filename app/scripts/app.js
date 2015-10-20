'use strict';

//browser
var browser = window.newBrowser(window);
var controls = browser.getControls();

//translate
function l(value) {
  return window.chrome.i18n.getMessage(value);
}

window.addEventListener('load', function appLoadEvent() {
  window.helpers.onLoad();

  // update checks
  var update = window.newUpdater(window);

  update.bind(function updateMsg(details) {
    window.toastr.info(l('Update'), l('newVersion') + ': ' + details.version, {
      'closeButton': true,
      'onclick': update.update.bind(update),
      'positionClass': 'toast-top-right',
      'timeOut': '60000',
      'extendedTimeOut': '10000'
    });
  });

  browser.bindWebview('#fimfiction');
  browser.setHome('https://www.fimfiction.net/');
  browser.setDomainLimit('fimfiction.net');
  //browser.allowNewWindows(true);
  browser.allowDownloadFrom('fimfiction.net');

  //the main app
  new Vue({
    el: '#app',
    data: {
      controls: controls
    },
    ready: function appReady() {
      var loading = jQuery('#loading');
      var loadingBrowserTimer = null;
      window._.defer(function menuDefer() {
        loading.attr('v-cloak', null); //enable - manually cause it's outside of app
        window.radialMenu(controls.check.bind(controls)); //browser radial menu
      });
      var firstBrowserLoad = true;
      var firstLoadBrowserTimer = null;
      browser.addChangeCallback(function changeCallback(type, err, e) {
        if (err && type === 'loadstart') {
          window.helpers.modal('#dialog', l('Alert'), l('block_url') + '<br>' + err.message, false);
          jQuery('#dialog').modal('show');
        } else if (err && type === 'newwindow') {
          window.helpers.modal('#dialog', l('Alert'), l('block_window') + '<br>' + err.message, false);
          jQuery('#dialog').modal('show');
        } else if (type === 'dialog') {
          e.preventDefault();

          if (e.messageType === 'confirm') {
            window.helpers.modal('#dialog', l('Confirm'), e.messageText, true, e.dialog);
            jQuery('#dialog').modal('show');
          } else if (e.messageType === 'prompt') {
            window.helpers.modal('#dialog', l('Alert'), 'Prompt dialog not handled, yet!', false, e.dialog);
            jQuery('#dialog').modal('show');
          } else {
            window.helpers.modal('#dialog', l('Alert'), e.messageText, false, e.dialog);
            jQuery('#dialog').modal('show');
          }
        }

        //show small circle to indicate page loading
        if (e.isTopLevel && type === 'loadstart') {
          loading.addClass('active');
          loadingBrowserTimer = window._.delay(function loadBrowserTimerDelay() {
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
          firstLoadBrowserTimer = window._.delay(function firstLoadBrowserTimerDelay() {
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
    }
  });
});
