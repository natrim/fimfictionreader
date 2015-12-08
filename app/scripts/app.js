'use strict';

/*globals _,window,chrome,createUpdater,createShortcuts,createBrowser,createWindow*/

function createApp(AppConfig) {
  // translate
  function l(value) {
    return chrome.i18n.getMessage(value);
  }

  // update checks
  var update = createUpdater(AppConfig.notifications + ':update');
  //check right now
  update.check();

  // browser
  var browser = createBrowser();
  var controls = browser.getControls();
  // shortcuts
  var shortcuts = createShortcuts(AppConfig.findSelector);
  // toolbar
  var toolbar = createWindow();

  window.addEventListener('load', function appLoadEvent() {
    var manifest = chrome.runtime.getManifest();
    browser.bindWebview('#browser', AppConfig.partition, AppConfig.userAgent + '/' + manifest.version);
    var homePage = AppConfig.url;
    browser.setDomainLimit(AppConfig.domainLimit);
    browser.allowDownloadFrom(AppConfig.domainLimit);

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
    //if deployed from store then sync settings
    if (manifest.key) {
      settingsType = 'sync';
    }
    //default settings
    var settings = _.clone(AppConfig.settings);

    //save settings keys for watches
    var settingsKeys = Object.keys(settings);

    //the main app
    var AppVM = new Vue({
      el: '#app',
      data: {
        controls: controls,
        settings: settings,
        appVersion: 'v' + manifest.version,
        shortDomainUrl: AppConfig.shortUrl
      },
      methods: {
        reloadApp: function () {
          update.update();
        },
        checkUpdates: function checkUpdates() {
          update.check(true);
        },
        setHome: function (url) {
          this.settings.homePage = url.replace(AppConfig.homeReplacer, '');
        },
        clearBrowser: function clearBrowser() {
          var resetDialog = function resetDialog() {};
          var clearId = AppConfig.notifications + ':clear_data';
          resetDialog.ok = function () {
            browser.getControls().clearData(function (ok) {
              if (ok) {
                chrome.notifications.create(clearId, {
                  type: 'basic',
                  iconUrl: 'images/icon-128.png',
                  title: l('ResetData'),
                  message: l('clear_data')
                });
              } else {
                chrome.notifications.create(clearId, {
                  type: 'basic',
                  iconUrl: 'images/icon-128.png',
                  title: l('ResetData'),
                  message: l('clear_data_fail')
                });
              }
            });
          };
          resetDialog.cancel = function () {};
          window.helpers.modal('#dialog', l('Confirm'), l('ConfirmResetData'), true, resetDialog);
          jQuery('#dialog').modal('show');
        }
      },
      ready: function appReady() {
        //enable tooltips
        jQuery('[data-content],[data-html]').popup();
        //settings dialog
        jQuery('#settingsDialog').modal({
          autofocus: false
        });
        //radial menu
        window.radialMenu(_.throttle(function (callback) {
          controls.check(); //sync func
          if (callback) {
            callback();
          }
        }), 100);
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

        //load settings and init
        chrome.storage[settingsType].get(settingsKeys, function getSettings(items) {
          if (!chrome.runtime.lastError) {
            _.each(settingsKeys, function (v) {
              if (typeof items[v] !== 'undefined') {
                settings[v] = items[v];
              }
            });
          }

          //settings save notification id
          var settingsId = AppConfig.notifications + ':settings';
          //watch for settings change
          _.each(settingsKeys, function (key) {
            var rollback = false;
            AppVM.$watch('settings.' + key, function (newVal, oldVal) {
              if (rollback) {
                rollback = false;
                return;
              }
              var set = {};
              set[key] = newVal;
              if (key === 'homePage') {
                set[key] = newVal.replace(AppConfig.homeReplacer, '');
              }
              chrome.storage[settingsType].set(set, function () {
                if (chrome.runtime.lastError) {
                  rollback = true;
                  settings[key] = oldVal;
                  if (key !== 'lastUrl') {
                    chrome.notifications.create(settingsId, {
                      type: 'basic',
                      iconUrl: 'images/icon-128.png',
                      title: l('Settings'),
                      message: l('SettingsSaveFailed')
                    });
                  }
                } else if (key !== 'lastUrl') {
                  if (key === 'homePage') {
                    browser.setHome(homePage + settings.homePage);
                  } else if (key === 'enableShiftToOpenWindow') {
                    browser.allowNewWindows(settings.enableShiftToOpenWindow);
                  } else if (key === 'toolbarType') {
                    if (typeof settings.toolbarType === 'undefined' || parseInt(settings.toolbarType) <= 0 || parseInt(settings.toolbarType) > 2) {
                      toolbar.toolbarType = toolbar.isMac ? 1 : 2;
                    } else {
                      toolbar.toolbarType = parseInt(settings.toolbarType);
                    }
                  }
                  chrome.notifications.create(settingsId, {
                    type: 'basic',
                    iconUrl: 'images/icon-128.png',
                    title: l('Settings'),
                    message: l('SettingsSaved')
                  });
                }
              });
            });
          });

          //set toolbar type
          if (typeof settings.toolbarType === 'undefined' || parseInt(settings.toolbarType) <= 0 || parseInt(settings.toolbarType) > 2) {
            toolbar.toolbarType = toolbar.isMac ? 1 : 2;
          } else {
            toolbar.toolbarType = parseInt(settings.toolbarType);
          }

          //set home from settings
          browser.setHome(homePage + settings.homePage);

          //start the browser loading
          browser.start(function startBrowsing(webview, done) {
            //goto last open page if available
            if (settings.saveLastPage) {
              webview.src = settings.lastUrl;
            }
            //bind shortcuts to browser
            shortcuts.bind(settings, browser, toolbar);
            //done show browser
            done();
          });
        });
      }
    });
  });
}

//load background page and get config
chrome.runtime.getBackgroundPage(function (win) {
  createApp(win.AppConfig);
});
