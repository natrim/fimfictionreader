/*globals window,document*/
(function inject() {
  'use strict';

  var appWindow = null,
    appOrigin = null;

  function _sendMessage(data) {
    if (appWindow && appOrigin) {
      appWindow.postMessage(data, appOrigin);
    }
  }

  function runScript(source) {
    var script = document.createElement('script');
    script.textContent = source;
    (document.head || document.documentElement).appendChild(script);
    setTimeout(function () {
      script.parentNode.removeChild(script);
    }, 0);
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
      if (command === 'execute') {
        runScript(event.data.value);
      } else if (command === 'scrollTop') {
        runScript('if(typeof jQuery !== \'undefined\')jQuery(\'html, body\').animate({scrollTop : 0}, 800); else window.scrollTo(0, 0);');
      }
    }
  }

  window.addEventListener('message', _receiveMessage);

  var scrollSender = null;
  var scrollSend = function () {
    if (scrollSender) {
      clearTimeout(scrollSender);
      scrollSender = null;
    }

    scrollSender = setTimeout(function () {
      scrollSender = null;
      _sendMessage({
        command: 'scroll',
        value: window.scrollY
      });
    }, 100);
  };

  window.addEventListener('load', scrollSend);
  window.addEventListener('scroll', scrollSend);
})();
