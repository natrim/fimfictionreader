'use strict';

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function () {
  var width = 1280;
  var height = 800;

  chrome.app.window.create('index.html', {
    id: 'main',
    frame: 'none',
    innerBounds: {
      width: width,
      height: height,
      minWidth: 375,
      minHeight: 627,
      left: Math.round((screen.availWidth - width) / 2),
      top: Math.round((screen.availHeight - height) / 2)
    }
  });
});
