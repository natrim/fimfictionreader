'use strict';

//translate
function l(value) {
  return window.chrome.i18n.getMessage(value);
}

// update checks
var update = window.newUpdater(window, l);
//check right now
update.check();

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
        var mod = jQuery('.settingsTrigger:not(.disabled)').get(0);
        if (mod) {
          mod.click();
        }
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
  browser.bindWebview('#fimfiction');
  //home move to settings to allow settings custom home
  //browser.setHome('https://www.fimfiction.net/');
  var homePage = 'https://www.fimfiction.net/';
  browser.setDomainLimit('fimfiction.net');
  //browser.allowNewWindows(true);
  browser.allowDownloadFrom('fimfiction.net');

  var settingsType = 'local'; //local or sync
  //default settings
  var settings = {
    enableKeyboardShortcuts: true,
    saveLastPage: true,
    homePage: '',
    lastUrl: ''
  };

  function initSettings() {
    var settingsId = 'fimfiction:settings';
    var clearId = 'fimfiction:clear_data';
    //settings
    var settingVM = new Vue({
      el: '#settings',
      data: settings,
      methods: {
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

    window._.each(settings, function (val, key) {
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
      browser.addChangeCallback(function saveLastUrl(type, err, e) {
        if (type === 'handshake') {
          settings.lastUrl = e.data.url;
        }
      });

      loadSettings(function settingsDone() {
        browser.setHome(homePage + settings.homePage);
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

  //enable tooltips
  jQuery('[data-content]').popup();
});
