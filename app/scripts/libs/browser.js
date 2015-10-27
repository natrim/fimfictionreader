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

    this.isHome = false;
    this.isBack = false;
    this.isForward = false;
    this.isTop = false;
    this.isReload = false;

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
    if (webview) {
      this.isBack = webview.canGoBack();
    } else {
      this.isBack = false;
    }

    return this.isBack;
  };

  BrowserControls.prototype.back = function goBack() {
    if (!this.canBack()) {
      return;
    }
    webview.back();
  };

  BrowserControls.prototype.canForward = function canGoForward() {
    if (webview) {
      this.isForward = webview.canGoForward();
    } else {
      this.isForward = false;
    }

    return this.isForward;
  };

  BrowserControls.prototype.forward = function goForward() {
    if (!this.canForward()) {
      return;
    }
    webview.forward();
  };

  BrowserControls.prototype.canReload = function canReloadPage() {
    if (webview) {
      this.isReload = true;
    } else {
      this.isReload = false;
    }
    return this.isReload;
  };

  BrowserControls.prototype.reload = function reloadPage() {
    if (!this.canReload()) {
      return;
    }
    webview.reload();
  };

  BrowserControls.prototype.canHome = function canGoHome() {
    if (webview) {
      this.isHome = webview.src !== homeUrl;
    } else {
      this.isHome = false;
    }
    return this.isHome;
  };

  BrowserControls.prototype.home = function goHome() {
    if (!webview) {
      return;
    }
    webview.src = homeUrl;
  };

  BrowserControls.prototype.go = function goToPage(page) {
    if (!webview) {
      return;
    }
    webview.src = page;
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
    if (webview) {
      this.isTop = webviewLoaded && this.scrollTopCan;
    } else {
      this.isTop = false;
    }
    return this.isTop;
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

  BrowserControls.prototype.check = function () {
    this.canReload();
    this.canHome();
    this.canTop();
    this.canBack();
    this.canForward();
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
      if (e.isTopLevel && webviewDomainLimit && (e.url.search(webviewDomainLimit) === -1 && e.url !== 'about:blank' && e.url !== 'data:text/html,chromewebdata')) {
        webview.stop();
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('loadstart', new Error(e.url), e, this);
          }, this);
        }
        return;
      }

      webviewLoaded = false;
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('loadstart', null, e, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('loadstop', function onStopWebview(e) {
      webviewLoaded = true;
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('loadstop', null, e, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('contentload', function onLoadWebview(e) {
      //shake hands to send this app id to web
      var handshake = function handshake(event) {
        if (event && event.data && event.data.command && event.data.command === 'handshakereply') {
          console.log('webview handshake received');
          if (event.data.url) {
            window.chrome.storage.local.set({
              'lastUrl': event.data.url
            });
          }
          window.removeEventListener('message', handshake);
        }
      }.bind(this);
      window.addEventListener('message', handshake);
      webview.contentWindow.postMessage({
        command: 'handshake'
      }, '*');

      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('contentload', null, e, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('newwindow', function onNewWindowWebview(e) {
      if (this._allowNewWindows) {
        e.preventDefault();
        window.open(e.targetUrl); //open in chrome
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('newwindow', null, e, this);
          }, this);
        }
      } else {
        e.window.discard();
        if (this._callbacks.length > 0) {
          _.each(this._callbacks, function (v) {
            v('newwindow', new Error(e.targetUrl), e, this);
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
          v('permissionrequest', null, e, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('dialog', function onDialogWebview(e) {
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('dialog', null, e, this);
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

    window.chrome.storage.local.get('lastUrl', function getLastUrl(items) {
      if (!window.chrome.runtime.lastError) {
        if (items.lastUrl) {
          webview.src = items.lastUrl;
        } else {
          webview.src = homeUrl;
        }
      } else {
        webview.src = homeUrl;
      }
    });
  };

  return new Browser();
}

if (typeof module !== 'undefined') {
  module.export.new = newBrowser;
}
