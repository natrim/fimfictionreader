'use strict';

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function onAppLaunch() {
  var width = 1280;
  var height = 800;

  chrome.app.window.create('index.html', {
    id: 'main',
    frame: 'none',
    innerBounds: {
      width: width,
      height: height,
      minWidth: 375,
      minHeight: 627
    }
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
