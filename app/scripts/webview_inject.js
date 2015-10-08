'use strict';

var appWindow = null,
  appOrigin = null;

function _sendMessage(data) {
  if (!appWindow || !appOrigin) {
    return console.error('Cannot send message to Chrome wrapper app - communication channel has not yet been opened');
  }
  appWindow.postMessage(data, appOrigin);
}

function runScript(source) {
  var script = document.createElement('script');
  script.textContent = source;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

function _receiveMessage(event) {
  if (!appWindow || !appOrigin) {
    appWindow = event.source;
    appOrigin = event.origin;

    _sendMessage({
      command: 'handshakereply'
    });
  }

  if (event && event.data && event.data.command) {
    var command = event.data.command;
    if (command === 'scrollTop') {
      runScript('if(typeof jQuery !== \'undefined\')jQuery(\'html, body\').animate({scrollTop : 0}, 800); else window.scrollTo(0, 0);');
    }
  }
}

window.addEventListener('message', _receiveMessage);

var scrollSender = null;
window.addEventListener('scroll', function () {
  if (scrollSender) {
    clearTimeout(scrollSender);
    scrollSender = null;
  }

  scrollSender = setTimeout(function () {
    scrollSender = null;
    if (appWindow && appOrigin) {
      _sendMessage({
        command: 'scroll',
        value: window.scrollY
      });
    }
  }, 100);

});
