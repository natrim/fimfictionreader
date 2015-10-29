'use strict';

var settingsType = 'local'; //local or sync
var settings = {
  saveLastPage: true,
  lastUrl: ''
};

//load settings
window.chrome.storage[settingsType].get(Object.keys(settings), function getSettings(items) {
  if (!window.chrome.runtime.lastError) {
    window._.each(Object.keys(settings), function (v) {
      if (typeof items[v] !== 'undefined') {
        settings[v] = items[v];
      }
    });
  }
});

//console.log(settings);

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
      browser.start(function startBrowsing(webview, done) {
        if (settings.saveLastPage) {
          webview.src = settings.lastUrl;
        }
        done();
      });

      //save last browser url
      browser.addChangeCallback(function saveLastUrl(type, err, e) {
        if (type === 'handshake') {
          window.chrome.storage[settingsType].set({
            'lastUrl': e.data.url
          });
        }
      });
    }
  });

  //settings
  new Vue({
    el: '#settings',
    data: settings,
    methods: {
      clearBrowser: function () {
        var resetDialog = function resetDialog() {};
        resetDialog.ok = function () {
          browser.getControls().clearData(function (ok) {
            if (ok) {
              window.toastr.success(l('clear_data'), l('Settings'), {
                'progressBar': false,
                'preventDuplicates': false,
                'closeButton': false,
                'positionClass': 'toast-bottom-left',
                'timeOut': '5000',
                'extendedTimeOut': '1000'
              });
            } else {
              window.toastr.error(l('clear_data_fail'), l('Settings'), {
                'progressBar': false,
                'preventDuplicates': false,
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
      },
      save: function saveSetting(event) {
        var $this = jQuery(event.target);
        var set = {};
        set[$this.attr('name')] = $this.is(':checked');
        window.chrome.storage[settingsType].set(set, function () {
          if (window.chrome.runtime.lastError) {
            settings[$this.attr('name')] = !settings[$this.attr('name')];
            window.toastr.error(l('SettingsSaveFailed'), l('Settings'), {
              'progressBar': false,
              'preventDuplicates': false,
              'closeButton': false,
              'positionClass': 'toast-bottom-left',
              'timeOut': '5000',
              'extendedTimeOut': '1000'
            });
          } else {
            window.toastr.success(l('SettingsSaved'), l('Settings'), {
              'progressBar': false,
              'preventDuplicates': false,
              'closeButton': false,
              'positionClass': 'toast-bottom-left',
              'timeOut': '3000',
              'extendedTimeOut': '1000'
            });
          }
        });
      }
    }
  });
});
