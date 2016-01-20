/*globals _,window,exports*/
/*exported createBrowser*/

var BrowserInstance;

function createBrowser() {
  'use strict';

  if (BrowserInstance) {
    return BrowserInstance;
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
      if (callback) {
        callback(false);
      }
      return;
    }
    webview.clearData({}, {
      'appcache': true,
      'cookies': true
    }, function clearDataDone() {
      this.home();
      if (callback) {
        callback(true);
      }
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

  Browser.prototype.exec = function exec(v) {
    if (!webview) {
      return;
    }
    if (!webviewLoaded) {
      return;
    }
    webview.focus();
    webview.contentWindow.postMessage({
      command: 'execute',
      value: v
    }, '*');
  };

  Browser.prototype.getControls = function getControls() {
    return this.controls;
  };

  Browser.prototype.allowNewWindows = function allowNewWindows(b) {
    this._allowNewWindows = b;
  };

  Browser.prototype.allowDownloadFrom = function allowDownloadFrom(d) {
    this._downloadFrom = d;
  };

  Browser.prototype.bindWebview = function bindWebview(selecter, partition, userAgent) {
    if (webview) {
      throw new Error('Browser is already bound to Webview!');
    }
    webview = window.document.querySelector(selecter);
    if (!webview) {
      throw new Error('Invalid selector or webview not found!');
    }

    //set where to save cookie and other data
    if (partition) {
      webview.partition = partition;
    }

    //useragent
    if (userAgent) {
      webview.setUserAgentOverride(webview.getUserAgent() + ' ' + userAgent);
    }

    //disable zoom
    webview.setZoomMode('disabled');

    //inject
    webview.addContentScripts([{
      name: 'rule',
      matches: ['http://*/*', 'https://*/*'],
      js: {
        files: ['scripts/inject.js']
      },
      css: {
        files: ['styles/inject.css']
      },
      'run_at': 'document_start'
    }]);

    //on close
    webview.addEventListener('close', function onCloseWebview(e) {
      webview.src = 'about:blank';
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('close', null, e, this);
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

    webview.addEventListener('loadabort', function onAbortWebview(e) {
      if (this._callbacks.length > 0) {
        _.each(this._callbacks, function (v) {
          v('loadabort', null, e, this);
        }, this);
      }
    }.bind(this));

    webview.addEventListener('contentload', function onLoadWebview(e) {
      //shake hands to send this app id to web
      var handshake = function handshake(event) {
        if (event && event.data && event.data.command && event.data.command === 'handshakereply') {
          if (event.data.url) {
            if (this._callbacks.length > 0) {
              _.each(this._callbacks, function (v) {
                v('handshake', null, event, this);
              }, this);
            }
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


    // force webview focus from app body
    setInterval(function keepWebviewFocus() {
      if (webview && webviewLoaded) {
        if (window.document.activeElement !== webview && window.document.activeElement.tagName !== 'INPUT' && window.document.activeElement.tagName !== 'TEXTAREA') {
          webview.focus();
        }
      }
    }, 1000);
  };

  Browser.prototype.setHome = function setHome(url) {
    homeUrl = url;
  };
  Browser.prototype.setDomainLimit = function setDomainLimit(reg) {
    webviewDomainLimit = reg;
  };

  Browser.prototype.getUrl = function getUrl() {
    return webview.src;
  };

  Browser.prototype.addChangeCallback = function addChangeCallback(callback) {
    if (typeof callback === 'function') {
      this._callbacks.push(callback);
    }
  };

  Browser.prototype.start = function startBrowser(callback) {
    if (!webview) {
      throw new Error('Use \'bindWebview\' to set webview selector first!');
    }
    if (!homeUrl) {
      throw new Error('Use \'setHome\' to set home page first!');
    }

    var done = function done() {
      if (webview.src === 'about:blank' || webview.src === '') {
        webview.src = homeUrl;
      }
    };

    if (callback) {
      callback(webview, done);
    } else {
      done();
    }
  };

  BrowserInstance = new Browser();
  return BrowserInstance;
}

if (typeof exports !== 'undefined') {
  exports.browser = createBrowser();
}
