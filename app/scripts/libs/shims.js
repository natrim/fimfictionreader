/*globals chrome*/
/*exported exports,require*/
var exports = {};
var require;
(function registerExports() {
  'use strict';
  require = function require(name) {
    if (typeof exports[name] !== 'undefined') {
      return exports[name];
    }
    return undefined;
  };
})();

(function shimChromeApp() {
  'use strict';
  if (typeof chrome.runtime.getManifest !== 'function') {
    chrome.runtime.getManifest = function () {
      return {
        name: 'Pony App DEV',
        shortname: 'PonyApp',
        description: 'Developing pony app.',
        key: 'ok',
        version: '1.0.0'
      };
    };
  }

  if (typeof chrome.runtime.requestUpdateCheck === 'undefined') {
    chrome.runtime.onUpdateAvailable = {
      addListener: function () {},
      removeListener: function () {}
    };

    chrome.runtime.requestUpdateCheck = function () {

    };
    chrome.runtime.reload = function () {
      window.location.reload();
    };
  }

  if (typeof chrome.i18n === 'undefined') {
    chrome.i18n = {};
    chrome.i18n.getMessage = function (strin) {
      return 'translated: ' + strin;
    };
  }

  if (typeof chrome.app.window === 'undefined') {
    chrome.app.window = {};
    chrome.app.window.current = function () {
      return {
        close: function () {
          window.close();
        },
        maximize: function () {},
        minimize: function () {},
        fullscreen: function () {},
        isMinimized: function () {
          return false;
        },
        isMaximized: function () {
          return false;
        },
        isFullscreen: function () {
          return false;
        },
        onMaximized: {
          addListener: function () {}
        },
        onMinimized: {
          addListener: function () {}
        },
        onRestored: {
          addListener: function () {}
        },
        onFullscreened: {
          addListener: function () {}
        },
        onBoundsChanged: {
          addListener: function () {}
        }
      };
    };
  }

  if (typeof chrome.storage === 'undefined') {
    chrome.storage = {};
    chrome.storage.sync = chrome.storage.local = {
      get: function (what, callback) {
        callback({});
      },
      set: function (what, callback) {
        callback();
      }
    };
  }

})();
