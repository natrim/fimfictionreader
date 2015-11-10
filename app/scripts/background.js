'use strict';

chrome.runtime.onUpdateAvailable.addListener(function onUpdateAvailable() {
  chrome.storage.local.set({
    'updateReady': Date.now()
  });
});

chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  var hang = setTimeout(function preventHang() {
    hang = null;
    chrome.runtime.reload();
  }, 5000);
  chrome.storage.local.get('updateReady', function loadGet(o) {
    if (hang) {
      clearTimeout(hang);
      hang = null;
    }
    if (o.updateReady && (o.updateReady + 86400000) >= Date.now()) {
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

chrome.runtime.onInstalled.addListener(function onInstalled() {
  chrome.storage.local.set({
    'updateReady': 0
  });
});
