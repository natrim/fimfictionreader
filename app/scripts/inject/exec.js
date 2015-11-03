'use strict';

/*global runScript */

window.addEventListener('message', function (event) {
  if (event && event.data && event.data.command) {
    var command = event.data.command;
    if (command === 'execute') {
      runScript(event.data.value);
    }
  }
});
