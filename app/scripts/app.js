'use strict';

//translate
function l(value) {
  return window.chrome.i18n.getMessage(value);
}

// update checks
var update = window.newUpdater(window);

update.bind(function updateMsg(details) {
  window.toastr.info(l('Update'), l('newVersion') + ': ' + details.version, {
    'closeButton': true,
    'progressBar': true,
    'preventDuplicates': true,
    'onclick': update.update.bind(update),
    'positionClass': 'toast-top-right',
    'timeOut': '60000',
    'extendedTimeOut': '10000'
  });
});

//browser
var browser = window.newBrowser(window);
var controls = browser.getControls();

function bindKeyboard(settings) {
  window.addEventListener('keydown', function shortcuts(e) {
    if (!settings.enableKeyboardShortcuts) {
      if (e.keyCode < 166 || e.keyCode > 168) { //media browser controls enabled anytime
        return;
      }
    }
    //166 back
    //167 forward
    //168 reload
    //37 left arrow
    //38 up arrow
    //39 right arrow
    //40 down arrow
    //70 f
    //80 p
    //82 r
    //188 ,
    switch (e.keyCode) {
    case 166:
    case 37:
      if (e.keyCode === 37 && !e.altKey && !e.metaKey) {
        break;
      }
      e.preventDefault();
      controls.back();
      break;
    case 167:
    case 39:
      if (e.keyCode === 39 && !e.altKey && !e.metaKey) {
        break;
      }
      e.preventDefault();
      controls.forward();
      break;
    case 38:
      if (e.altKey || e.metaKey) {
        e.preventDefault();
        controls.top();
      }
      break;
    case 168:
    case 40:
    case 82:
      if (e.keyCode === 40 && !e.altKey && !e.metaKey) {
        break;
      } else if (e.keyCode === 82 && !e.ctrlKey && !e.metaKey) {
        break;
      }
      e.preventDefault();
      controls.reload();
      break;
    case 80:
    case 188:
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        jQuery('#settingsDialog').modal('toggle');
      }
      break;
    case 70:
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if ((e.ctrlKey && e.metaKey) || (e.ctrlKey && e.altKey)) {
          window.appWindow.fullscreen();
        } else {
          browser.exec('jQuery(\'#site-search input[name="search"]\').val(\'\').focus();jQuery(\'html, body\').animate({scrollTop : 0}, 300);');
        }
      }
      break;
    }
  });
}

window.addEventListener('load', function appLoadEvent() {
  window.helpers.onLoad();

  browser.bindWebview('#fimfiction');
  browser.setHome('https://www.fimfiction.net/');
  browser.setDomainLimit('fimfiction.net');
  //browser.allowNewWindows(true);
  browser.allowDownloadFrom('fimfiction.net');

  var settingsType = 'local'; //local or sync
  //default settings
  var settings = {
    enableKeyboardShortcuts: true,
    saveLastPage: true,
    lastUrl: ''
  };

  function initSettings() {
    //settings
    var settingVM = new Vue({
      el: '#settings',
      data: settings,
      methods: {
        clearBrowser: function () {
          var resetDialog = function resetDialog() {};
          resetDialog.ok = function () {
            browser.getControls().clearData(function (ok) {
              if (ok) {
                window.toastr.success(l('clear_data'), l('Settings'), {
                  'closeButton': false,
                  'positionClass': 'toast-bottom-left',
                  'timeOut': '5000',
                  'extendedTimeOut': '1000'
                });
              } else {
                window.toastr.error(l('clear_data_fail'), l('Settings'), {
                  'closeButton': false,
                  'positionClass': 'toast-bottom-left',
                  'timeOut': '5000',
                  'extendedTimeOut': '1000'
                });
              }
            });
          };
          resetDialog.cancel = function () {};
          window.helpers.modal('#dialog', l('Confirm'), l('ConfirmResetData'), true, resetDialog);
          jQuery('#dialog').modal('show');
        }
      }
    });

    window._.each(settings, function (val, key) {
      var rollback = false;
      settingVM.$watch(key, function (newVal, oldVal) {
        if (rollback) {
          rollback = false;
          return;
        }
        var set = {};
        set[key] = newVal;
        window.chrome.storage[settingsType].set(set, function () {
          if (window.chrome.runtime.lastError) {
            rollback = true;
            settings[key] = oldVal;
            if (key !== 'lastUrl') {
              window.toastr.error(l('SettingsSaveFailed'), l('Settings'), {
                'closeButton': false,
                'positionClass': 'toast-bottom-left',
                'timeOut': '5000',
                'extendedTimeOut': '1000'
              });
            }
          } else if (key !== 'lastUrl') {
            window.toastr.success(l('SettingsSaved'), l('Settings'), {
              'closeButton': false,
              'positionClass': 'toast-bottom-left',
              'timeOut': '3000',
              'extendedTimeOut': '1000'
            });
          }
        });
      });
    });
  }

  function loadSettings(callback) {
    window.chrome.storage[settingsType].get(Object.keys(settings), function getSettings(items) {
      if (!window.chrome.runtime.lastError) {
        window._.each(Object.keys(settings), function (v) {
          if (typeof items[v] !== 'undefined') {
            settings[v] = items[v];
          }
        });
      }
      initSettings();
      if (callback) {
        callback();
      }
    });
  }

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

      //save last browser url
      browser.addChangeCallback(function saveLastUrl(type, err, e) {
        if (type === 'handshake') {
          settings.lastUrl = e.data.url;
        }
      });

      loadSettings(function settingsDone() {
        //start the browser loading
        browser.start(function startBrowsing(webview, done) {
          if (settings.saveLastPage) {
            webview.src = settings.lastUrl;
          }
          bindKeyboard(settings);
          done();
        });
      });
    }
  });


});
