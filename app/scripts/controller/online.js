/*globals _,window,jQuery,exports,require*/
/*exported createOnlineController*/

function createOnlineController(router, settings) {
  'use strict';

  var AppConfig = AppConfig || require('config');
  var l = AppConfig.translate;

  // browser
  var browser = require('browser');

  //alow new windows with shift click (not here, goes to chrome)
  window.addEventListener('keydown', function newWDown(e) {
    if (!settings.enableShiftToOpenWindow) {
      return;
    }
    if (e.keyCode === 16) {
      browser.allowNewWindows(true);
    }
  });
  window.addEventListener('keyup', function newWUp(e) {
    if (!settings.enableShiftToOpenWindow) {
      return;
    }
    if (e.keyCode === 16) {
      browser.allowNewWindows(false);
    }
  });


  return {
    template: '<webview allowtransparency="on" class="trim full" flex id="browser"></webview>',
    destroyed: function destroyOnline() {
      browser.clearWebview();
    },
    ready: function onlineReady() {
      browser.bindWebview('#browser', AppConfig.partition, AppConfig.userAgent);
      browser.setDomainLimit(AppConfig.domainLimit);
      browser.allowDownloadFrom(AppConfig.domainLimit);

      //and now browser
      var loading = jQuery('#loading');
      var loadingBrowserTimer = null;
      var firstBrowserLoad = true;
      var firstLoadBrowserTimer = null;
      browser.addChangeCallback(function changeCallback(type, err, e) {
        if (err && type === 'loadstart') {
          window.alert(l('Alert'), l('block_url') + '<br>' + err.message + (settings.enableShiftToOpenWindow ? ('<br><br>' + l('block_exception')) : ''));
        } else if (err && type === 'newwindow') {
          window.alert(l('Alert'), l('block_window') + '<br>' + err.message + (settings.enableShiftToOpenWindow ? ('<br><br>' + l('block_exception')) : ''));
        } else if (type === 'dialog') {
          e.preventDefault();

          if (e.messageType === 'confirm') {
            window.confirm(l('Confirm'), e.messageText, e.dialog);
          } else if (e.messageType === 'prompt') {
            window.prompt(l('Prompt'), e.messageText, e.dialog);
          } else {
            window.alert(l('Alert'), e.messageText, e.dialog);
          }
        }

        //show small circle to indicate page loading
        if (e.isTopLevel && type === 'loadstart') {
          loading.addClass('active');
          loadingBrowserTimer = _.delay(function loadBrowserTimerDelay() {
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
          firstLoadBrowserTimer = _.delay(function firstLoadBrowserTimerDelay() {
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

      //save last browser url
      var debouncedSaveLastUrl = _.debounce(function (url) {
        settings.lastUrl = url;
      }, 500);
      browser.addChangeCallback(function saveLastUrl(type, err, e) {
        if (type === 'handshake') {
          debouncedSaveLastUrl(e.data.url);
        }
      });

      //start the browser loading
      browser.start(function startBrowsing(webview, done) {
        //goto last open page if available
        if (settings.saveLastPage) {
          webview.src = settings.lastUrl;
        }

        //done show browser
        done();
      });
    }
  };
}

if (typeof exports !== 'undefined') {
  exports.online = {
    create: createOnlineController
  };
}
