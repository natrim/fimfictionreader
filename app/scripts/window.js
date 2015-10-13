'use strict';

function AppWindow(win, _) {
  this.window = win;
  if (typeof _ === 'undefined') { //try global
    if (typeof win._ === 'undefined') {
      throw new Error('Missing unrescore.js!');
    } else {
      this._ = win._;
    }
  } else {
    this._ = _;
  }

  //states
  this.isMinimized = false;
  this.isMaximized = false;
  this.isFocused = false;
  this.isFullscreen = false;
  this._callbacks = [];

  var throttled = _.debounce(this.changeWindow, 100); //because some events fire right after another

  this.window.chrome.app.window.current().onMaximized.addListener(throttled.bind(this, 'maximize'));
  this.window.chrome.app.window.current().onMinimized.addListener(throttled.bind(this, 'minimize'));
  this.window.chrome.app.window.current().onRestored.addListener(throttled.bind(this, 'restore'));
  this.window.chrome.app.window.current().onFullscreened.addListener(throttled.bind(this, 'fullscreen'));

  this.window.addEventListener('focus', throttled.bind(this, 'focus', true));
  this.window.addEventListener('blur', throttled.bind(this, 'blur', false));

  //init window values
  this.changeWindow();
}

AppWindow.prototype.updateContentSize = function updateContentSize(contentSelector) {
  if (contentSelector) {
    if (!this._contentSelector) {
      this.window.addEventListener('resize', this._.debounce(this.updateContentSize, 10).bind(this, ''));
    }

    this._contentSelector = contentSelector;
  }
  if (!this._contentSelector) {
    throw new Error('No content selecter provided! You need to provide it at least once!');
  }

  var content = this.window.document.querySelector(this._contentSelector);
  if (content) {
    content.style.height = this.window.document.documentElement.clientHeight + 'px';
    content.style.width = this.window.document.documentElement.clientWidth + 'px';
  }
};

AppWindow.prototype.changeWindow = function changeWindow(type, focus) {
  this.isMinimized = this.window.chrome.app.window.current().isMinimized();
  this.isMaximized = this.window.chrome.app.window.current().isMaximized();
  this.isFocused = (typeof focus === 'boolean' ? focus : this.window.document.hasFocus());
  this.isFullscreen = this.window.chrome.app.window.current().isFullscreen();

  if (this._callbacks.length > 0) {
    this._.each(this._callbacks, function (v) {
      v(type, this);
    }, this);
  }
};

AppWindow.prototype.minimize = function minimizeWindow(callback) {
  this.window.chrome.app.window.current().minimize();
  if (typeof callback === 'function') {
    callback(this);
  }
};

AppWindow.prototype.maximize = function maximizeWindow(callback) {
  if (this.isMaximized || this.isFullscreen) {
    this.window.chrome.app.window.current().restore();
  } else {
    this.window.chrome.app.window.current().maximize();
  }
  if (typeof callback === 'function') {
    callback(this);
  }
};

AppWindow.prototype.close = function closeWindow(callback) {
  this.window.chrome.app.window.current().close();
  if (typeof callback === 'function') {
    callback(this);
  }
};

AppWindow.prototype.addCallback = function addCallback(callback) {
  if (typeof callback === 'function') {
    this._callbacks.push(callback);
  }
};

if (typeof module !== 'undefined') {
  module.export.AppWindow = AppWindow;
  module.export.new = function newWindow() {
    return new AppWindow(window);
  };
}

if (typeof angular !== 'undefined') {
  angular.module('appWindow', [])
    .factory('appWindow', ['$window', '_', function newWindow(win, _) {
      return new AppWindow(win, _);
    }]);
}
