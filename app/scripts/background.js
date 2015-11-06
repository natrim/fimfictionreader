'use strict';

chrome.runtime.onUpdateAvailable.addListener(function onUpdateAvailable() {
  chrome.storage.local.set({
    'updateReady': true
  });
});

chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  chrome.storage.local.get('updateReady', function loadGet(o) {
    if (o.updateReady) {
      chrome.runtime.reload();
      return;
    }

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
});

chrome.runtime.onInstalled.addListener(function onInstalled(e) {
  chrome.storage.local.set({
    'updateReady': false
  });
});
