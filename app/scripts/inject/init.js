'use strict';

/*jshint unused: false*/

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
}

window.addEventListener('message', _receiveMessage);
