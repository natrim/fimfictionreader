'use strict';

/*globals _,window,chrome*/
/*exported createWindow*/

var AppWindowInstance;

function createWindow() {
  if (AppWindowInstance) {
    return AppWindowInstance;
  }

  function AppWindow() {
    //states
    this.isMinimized = false;
    this.isMaximized = false;
    this.isFocused = false;
    this.isFullscreen = false;
    this._callbacks = [];

    this.isMac = false;
    this.isLinux = false;
    this.isWindows = false;
    this.toolbarType = 1;
    if (chrome.runtime && chrome.runtime.getPlatformInfo) {
      chrome.runtime.getPlatformInfo(function getPlatformInfo(info) {
        this.isMac = info.os === 'mac';
        this.isLinux = info.os === 'linux';
        this.isWindows = info.os === 'windows';
        if (this.isMac) {
          this.toolbarType = 2;
        }
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('os', this);
          }, this);
        }
      }.bind(this));
    } else if (navigator) {
      this.isMac = navigator.appVersion.indexOf('Mac') !== -1;
      this.isLinux = navigator.appVersion.indexOf('Linux') !== -1;
      this.isWindows = navigator.appVersion.indexOf('Win') !== -1;
    }

    var throttled = _.debounce(this.changeWindow, 100); //because some events fire right after another

    chrome.app.window.current().onMaximized.addListener(throttled.bind(this, 'maximize'));
    chrome.app.window.current().onMinimized.addListener(throttled.bind(this, 'minimize'));
    chrome.app.window.current().onRestored.addListener(throttled.bind(this, 'restore'));
    chrome.app.window.current().onFullscreened.addListener(throttled.bind(this, 'fullscreen'));
    chrome.app.window.current().onBoundsChanged.addListener(throttled.bind(this, 'resize'));

    window.addEventListener('focus', throttled.bind(this, 'focus', true));
    window.addEventListener('blur', throttled.bind(this, 'blur', false));

    //init window values
    this.changeWindow();
  }

  AppWindow.prototype.updateContentSize = function updateContentSize(contentSelector, minusSelector) {
    if (contentSelector) {
      if (!this._contentSelector) {
        window.addEventListener('resize', _.debounce(this.updateContentSize, 10).bind(this, '', ''));
      }

      this._contentSelector = contentSelector;
    }
    if (!this._contentSelector) {
      throw new Error('No content selecter provided! You need to provide it at least once!');
    }
    if (minusSelector) {
      this._minusSelector = minusSelector;
    }

    var content = window.document.querySelector(this._contentSelector);
    if (content) {
      content.style.height = window.document.documentElement.clientHeight + 'px';
      content.style.width = window.document.documentElement.clientWidth + 'px';
      if (this._minusSelector) {
        var minus = window.document.querySelector(this._minusSelector);
        if (minus) {
          content.style.height = (window.document.documentElement.clientHeight - minus.clientHeight) + 'px';
        }
      }
    }
  };

  AppWindow.prototype.bindContent = AppWindow.prototype.updateContentSize;

  AppWindow.prototype.changeWindow = function changeWindow(type, focus) {
    this.isMinimized = chrome.app.window.current().isMinimized();
    this.isMaximized = chrome.app.window.current().isMaximized();
    this.isFocused = (typeof focus === 'boolean' ? focus : window.document.hasFocus());
    this.isFullscreen = chrome.app.window.current().isFullscreen();

    if (this._callbacks.length > 0) {
      _.each(this._callbacks, function (v) {
        v(type, this);
      }, this);
    }
  };

  AppWindow.prototype.fullscreen = function fullscreen(callback) {
    if (this.isFullscreen) {
      chrome.app.window.current().restore();
    } else {
      if (this.isMaximized) {
        chrome.app.window.current().restore();
      }
      chrome.app.window.current().fullscreen();
    }
    if (typeof callback === 'function') {
      callback(this);
    }
  };

  AppWindow.prototype.minimize = function minimizeWindow(callback) {
    chrome.app.window.current().minimize();
    if (typeof callback === 'function') {
      callback(this);
    }
  };

  AppWindow.prototype.maximize = function maximizeWindow(callback) {
    if (this.isMaximized || this.isFullscreen) {
      chrome.app.window.current().restore();
    } else {
      chrome.app.window.current().maximize();
    }
    if (typeof callback === 'function') {
      callback(this);
    }
  };

  AppWindow.prototype.close = function closeWindow(callback) {
    chrome.app.window.current().close();
    if (typeof callback === 'function') {
      callback(this);
    }
  };

  AppWindow.prototype.addChangeCallback = function addChangeCallback(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  };

  AppWindowInstance = new AppWindow();
  return AppWindowInstance;
}
