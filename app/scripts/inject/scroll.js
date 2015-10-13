'use strict';

/*global _sendMessage, runScript */

window.addEventListener('message', function (event) {
  if (event && event.data && event.data.command) {
    var command = event.data.command;
    if (command === 'scrollTop') {
      runScript('if(typeof jQuery !== \'undefined\')jQuery(\'html, body\').animate({scrollTop : 0}, 800); else window.scrollTo(0, 0);');
    }
  }
});

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
