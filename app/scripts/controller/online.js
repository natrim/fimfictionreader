'use strict';

/*globals _,window,chrome,createShortcuts,createBrowser,createWindow*/
/*exported createOnlineController*/

function createOnlineController(AppConfig, settings) {
  var l = AppConfig.translate;

  // browser
  var browser = createBrowser();
  var controls = browser.getControls();
  // shortcuts
  var shortcuts = createShortcuts(AppConfig.translate, AppConfig.findSelector);
  // toolbar
  var toolbar = createWindow();

  var manifest = chrome.runtime.getManifest();

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


  return Vue.extend({
    template: '<webview allowtransparency="on" class="trim full" flex id="browser"></webview>',
    ready: function online() {
      browser.bindWebview('#browser', AppConfig.partition, AppConfig.userAgent + '/' + manifest.version);
      browser.setDomainLimit(AppConfig.domainLimit);
      browser.allowDownloadFrom(AppConfig.domainLimit);

      //and now browser
      var loading = jQuery('#loading');
      var loadingBrowserTimer = null;
      var firstBrowserLoad = true;
      var firstLoadBrowserTimer = null;
      browser.addChangeCallback(function changeCallback(type, err, e) {
        if (err && type === 'loadstart') {
          window.helpers.modal('#dialog', l('Alert'), l('block_url') + '<br>' + err.message + (settings.enableShiftToOpenWindow ? ('<br><br>' + l('block_exception')) : ''), false);
          jQuery('#dialog').modal('show');
        } else if (err && type === 'newwindow') {
          window.helpers.modal('#dialog', l('Alert'), l('block_window') + '<br>' + err.message + (settings.enableShiftToOpenWindow ? ('<br><br>' + l('block_exception')) : ''), false);
          jQuery('#dialog').modal('show');
        } else if (type === 'dialog') {
          e.preventDefault();

          if (e.messageType === 'confirm') {
            window.helpers.modal('#dialog', l('Confirm'), e.messageText, true, e.dialog);
            jQuery('#dialog').modal('show');
          } else if (e.messageType === 'prompt') {
            window.helpers.modal('#dialog', l('Prompt'), e.messageText, true, e.dialog, true);
            jQuery('#dialog').modal('show');
          } else {
            window.helpers.modal('#dialog', l('Alert'), e.messageText, false, e.dialog);
            jQuery('#dialog').modal('show');
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
        //bind shortcuts to browser
        shortcuts.bind(settings, browser, toolbar);

        //radial menu
        window.radialMenu(_.throttle(function (callback) {
          controls.check(); //sync func
          if (callback) {
            callback();
          }
        }, 100));

        //goto last open page if available
        if (settings.saveLastPage) {
          webview.src = settings.lastUrl;
        }

        //done show browser
        done();
      });
    }
  });
}
