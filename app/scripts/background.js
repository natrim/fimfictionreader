'use strict';

var bounds = {
  width: 1280,
  height: 800,
  minWidth: 375,
  minHeight: 627
};

// on launch create the window
chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  chrome.app.window.create('index.html', {
    id: 'fimfiction:main',
    frame: 'none',
    innerBounds: bounds
  });
});

var notification = 'fimfiction:upgraded';
chrome.runtime.onInstalled.addListener(function onInstalled(e) {
  if (!e.previousVersion) {
    return;
  }
  var manifest = chrome.runtime.getManifest();
  if (e.previousVersion !== manifest.version) {
    chrome.notifications.create(notification, {
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: chrome.i18n.getMessage('notificationUpdated'),
      message: chrome.i18n.getMessage('notificationUpdatedDetail', [manifest.version]),
    }, function (id) {
      notification = id;
    });
  }
});
