'use strict';

// translate
function l(value) {
  return window.chrome.i18n.getMessage(value);
}

// update checks
var update = window.newUpdater(window, l);
//check right now
update.check();

// browser
var browser = window.newBrowser(window);
var controls = browser.getControls();

// shortcuts
var shortcuts = window.newShortcuts(window, window._, l);

window.addEventListener('load', function appLoadEvent() {
  browser.bindWebview('#fimfiction');
  //home move to settings to allow settings custom home
  //browser.setHome('https://www.fimfiction.net/');
  var homePage = 'https://www.fimfiction.net/';
  browser.setDomainLimit('fimfiction.net');
  browser.allowDownloadFrom('fimfiction.net');

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

  var settingsType = 'local'; //local or sync
  //default settings
  var settings = {
    enableKeyboardShortcuts: true,
    enableShiftToOpenWindow: true,
    saveLastPage: true,
    homePage: '',
    lastUrl: ''
  };
  var settingsKeys = Object.keys(settings);

  //take manifest with you
  settings.manifest = window.chrome.runtime.getManifest();
  //if deployed from store then sync settings
  if (settings.manifest.key) {
    settingsType = 'sync';
  }

  function initSettings() {
    var settingsId = 'fimfiction:settings';
    var clearId = 'fimfiction:clear_data';

    //settings
    var settingVM = new Vue({
      el: '#settings',
      data: settings,
      methods: {
        reloadApp: function () {
          update.update();
        },
        checkUpdates: function checkUpdates() {
          update.check(true);
        },
        setHome: function (url) {
          this.homePage = url.replace(/https?\:\/\/((.*)\.)?fimfiction\.net\/?/, '');
        },
        clearBrowser: function clearBrowser() {
          var resetDialog = function resetDialog() {};
          resetDialog.ok = function () {
            browser.getControls().clearData(function (ok) {
              if (ok) {
                window.chrome.notifications.clear(clearId, function clearNotifications() {
                  window.chrome.notifications.create(clearId, {
                    type: 'basic',
                    iconUrl: 'images/icon-128.png',
                    title: l('ResetData'),
                    message: l('clear_data')
                  }, function (id) {
                    clearId = id;
                  });
                });
              } else {
                window.chrome.notifications.clear(clearId, function clearNotifications() {
                  window.chrome.notifications.create(clearId, {
                    type: 'basic',
                    iconUrl: 'images/icon-128.png',
                    title: l('ResetData'),
                    message: l('clear_data_fail')
                  }, function (id) {
                    clearId = id;
                  });
                });
              }
            });
          };
          resetDialog.cancel = function () {};
          window.helpers.modal('#dialog', l('Confirm'), l('ConfirmResetData'), true, resetDialog);
          jQuery('#dialog').modal('show');
        }
      },
      ready: function settingsReady() {
        jQuery('.settingsTrigger').removeClass('disabled');
        //settings dialog setting
        jQuery('#settingsDialog').modal({
          autofocus: false
        });
      }
    });

    window._.each(settingsKeys, function (key) {
      var rollback = false;
      settingVM.$watch(key, function (newVal, oldVal) {
        if (rollback) {
          rollback = false;
          return;
        }
        var set = {};
        set[key] = newVal;
        if (key === 'homePage') {
          set[key] = newVal.replace(/https?\:\/\/((.*)\.)?fimfiction\.net\/?/, '');
        }
        window.chrome.storage[settingsType].set(set, function () {
          if (window.chrome.runtime.lastError) {
            rollback = true;
            settings[key] = oldVal;
            if (key !== 'lastUrl') {
              window.chrome.notifications.clear(settingsId, function clearNotifications() {
                window.chrome.notifications.create(settingsId, {
                  type: 'basic',
                  iconUrl: 'images/icon-128.png',
                  title: l('Settings'),
                  message: l('SettingsSaveFailed')
                }, function (id) {
                  settingsId = id;
                });
              });
            }
          } else if (key !== 'lastUrl') {
            if (key === 'homePage') {
              browser.setHome(homePage + settings.homePage);
            } else if (key === 'enableShiftToOpenWindow') {
              browser.allowNewWindows(settings.enableShiftToOpenWindow);
            }
            window.chrome.notifications.clear(settingsId, function clearNotifications() {
              window.chrome.notifications.create(settingsId, {
                type: 'basic',
                iconUrl: 'images/icon-128.png',
                title: l('Settings'),
                message: l('SettingsSaved')
              }, function (id) {
                settingsId = id;
              });
            });
          }
        });
      });
    });
  }

  function loadSettings(callback) {
    window.chrome.storage[settingsType].get(settingsKeys, function getSettings(items) {
      if (!window.chrome.runtime.lastError) {
        window._.each(settingsKeys, function (v) {
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
        window.radialMenu(function (callback) {
          controls.check(); //sync func
          if (callback) {
            callback();
          }
        }); //browser radial menu
      });
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
      var debouncedSaveLastUrl = window._.debounce(function (url) {
        settings.lastUrl = url;
      }, 500);
      browser.addChangeCallback(function saveLastUrl(type, err, e) {
        if (type === 'handshake') {
          debouncedSaveLastUrl(e.data.url);
        }
      });

      loadSettings(function settingsDone() {
        browser.setHome(homePage + settings.homePage);
        //start the browser loading
        browser.start(function startBrowsing(webview, done) {
          if (settings.saveLastPage) {
            webview.src = settings.lastUrl;
          }
          shortcuts.bind(settings, browser);
          done();
        });
      });
    }
  });

  //enable tooltips
  jQuery('[data-content]').popup();
});
