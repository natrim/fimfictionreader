'use strict';

chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  chrome.app.window.create('index.html', {
    id: 'fimfiction:main',
    frame: 'none',
    innerBounds: {
      width: 1280,
      height: 800,
      minWidth: 375,
      minHeight: 627
    }
  });
});
