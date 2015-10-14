'use strict';

function newBrowser(window, _, timeout) {
  if (typeof _ === 'undefined') { //try global
    if (typeof window._ === 'undefined') {
      throw new Error('Missing underscore.js!');
    } else {
      _ = window._;
    }
  }

  if (typeof timeout === 'undefined') {
    timeout = function timeout(callback, timer) {
      if (timer) {
        return _.delay(callback, timer);
      } else {
        return _.defer(callback);
      }
    };

    timeout.prototype.clear = function clearTimeout(ret) {
      return clearTimeout(ret);
    };
  }

  var homeUrl;
  var webviewDomainLimit;
  var webview;
  var webviewLoaded = false;

  function BrowserControls() {
    this._callbacks = [];

    this.scrollTopCan = false;
    window.addEventListener('message', function onMessage() {
      if (event && event.data && event.data.command && event.data.command === 'scroll') {
        //console.log('received scroll: ' + event.data.value);
        if (event.data.value > 100) {
          this.scrollTopCan = true;
        } else {
          this.scrollTopCan = false;
        }

        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('scroll', this);
          }, this);
        }
      }
    }.bind(this));
  }

  BrowserControls.prototype.addChangeCallback = function addChangeCallback(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  };

  BrowserControls.prototype.canBack = function canGoBack() {
    if (!webview) {
      return false;
    }
    return webview.canGoBack();
  };

  BrowserControls.prototype.back = function goBack() {
    if (!webview) {
      return;
    }
    if (webview.canGoBack()) {
      webview.back();
    }
  };

  BrowserControls.prototype.canForward = function canGoForward() {
    if (!webview) {
      return false;
    }
    return webview.canGoForward();
  };

  BrowserControls.prototype.forward = function goForward() {
    if (!webview) {
      return;
    }
    if (webview.canGoForward()) {
      webview.forward();
    }
  };

  BrowserControls.prototype.canReload = function canReloadPage() {
    if (!webview) {
      return false;
    }
    return true; //reload anytime
  };

  BrowserControls.prototype.reload = function reloadPage() {
    if (!webview) {
      return;
    }
    webview.reload();
  };

  BrowserControls.prototype.canHome = function canGoHome() {
    if (!webview) {
      return false;
    }
    return webview.src !== homeUrl;
  };

  BrowserControls.prototype.home = function goHome() {
    if (!webview) {
      return;
    }
    webview.src = homeUrl;
  };

  BrowserControls.prototype.clearData = function clearData(callback) {
    if (!webview) {
      callback(false);
      return;
    }
    webview.clearData({}, {
      'appcache': true,
      'cookies': true
    }, function clearDataDone() {
      this.home();
      callback(true);
    }.bind(this));
  };

  BrowserControls.prototype.canTop = function canGoTop() {
    if (!webview) {
      return false;
    }
    return webviewLoaded && this.scrollTopCan;
  };

  BrowserControls.prototype.top = function goTop() {
    if (!webview) {
      return;
    }
    if (!webviewLoaded) {
      return;
    }
    webview.contentWindow.postMessage({
      command: 'scrollTop'
    }, '*');
  };


  function Browser() {
    this._callbacks = [];
    this._downloadFrom = '';
    this._allowNewWindows = false;
    this.controls = new BrowserControls();
  }

  Browser.prototype.getControls = function getControls() {
    return this.controls;
  };

  Browser.prototype.allowNewWindows = function allowNewWindows(b) {
    this._allowNewWindows = b;
  };

  Browser.prototype.allowDownloadFrom = function allowDownloadFrom(d) {
    this._downloadFrom = d;
  };

  Browser.prototype.bindWebview = function bindWebview(selecter) {
    webview = window.document.querySelector(selecter);
    if (!webview) {
      throw new Error('Invalid selector or webview not found!');
    }

    //inject
    webview.addContentScripts([{
      name: 'rule',
      matches: ['http://*/*', 'https://*/*'],
      js: {
        files: ['scripts/inject/init.js', 'scripts/inject/scroll.js']
      },
      'run_at': 'document_start'
    }]);

    //on close
    webview.addEventListener('close', function onCloseWebview() {
      webview.src = 'about:blank';
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('close', null, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('loadstart', function onStartWebview(e) {
      if (e.isTopLevel && webviewDomainLimit && (e.url.search(webviewDomainLimit) === -1 && e.url.search('about:blank') === -1)) {
        webview.stop();
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('loadstart', new Error(e.url), this);
          }, this);
        }
        return;
      }

      webviewLoaded = false;
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('loadstart', null, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('loadstop', function onStopWebview() {
      webviewLoaded = true;
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('loadstop', null, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('contentload', function onLoadWebview() {
      //shake hands to send this app id to web
      var handshake = function handshake(event) {
        if (event && event.data && event.data.command && event.data.command === 'handshakereply') {
          console.log('webview handshake received');
          window.removeEventListener('message', handshake);
        }
      };
      window.addEventListener('message', handshake);
      webview.contentWindow.postMessage({
        command: 'handshake'
      }, '*');

      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('contentload', null, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('newwindow', function onNewWindowWebview(e) {
      if (this._allowNewWindows) {
        e.preventDefault();
        window.open(e.targetUrl); //open in chrome
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('newwindow', null, this);
          }, this);
        }
      } else {
        e.window.discard();
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('newwindow', new Error(e.targetUrl), this);
          }, this);
        }
      }
    }.bind(this));

    webview.addEventListener('permissionrequest', function onPermissionWebview(e) {
      if (e.permission === 'download' && this._downloadFrom && e.request.url.search(this._downloadFrom) !== -1) {
        e.request.allow();
      }
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('permissionrequest', null, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('dialog', function onDialogWebview(e) {
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('dialog', e, this);
        }, this);
      }
    }.bind(this));
  };

  Browser.prototype.setHome = function setHome(url) {
    homeUrl = url;
  };
  Browser.prototype.setDomainLimit = function setDomainLimit(reg) {
    webviewDomainLimit = reg;
  };

  Browser.prototype.addChangeCallback = function addChangeCallback(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  };

  Browser.prototype.start = function startBrowser() {
    if (!webview) {
      throw new Error('Use \'bindWebview\' to set webview selector first!');
    }
    if (!homeUrl) {
      throw new Error('Use \'setHome\' to set home page first!');
    }

    //TODO: load last url from storage
    //for now go home
    webview.src = homeUrl;
  };

  return new Browser();
}

if (typeof module !== 'undefined') {
  module.export.new = newBrowser;
}

if (typeof angular !== 'undefined') {
  angular.module('browser', [])
    .factory('browser', ['$window', '_', '$timeout', newBrowser]);
}
