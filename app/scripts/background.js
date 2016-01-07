/*globals chrome*/

chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  'use strict';

  chrome.app.window.create('index.html', {
    id: 'app:main',
    frame: 'none',
    innerBounds: {
      width: 1280,
      height: 800,
      minWidth: 375,
      minHeight: 627
    }
  });
});

chrome.runtime.onInstalled.addListener(function onInstalled(e) {
  'use strict';

  if (!e.previousVersion) {
    return;
  }

  var manifest = chrome.runtime.getManifest();

  if (('v' + e.previousVersion) !== ('v' + manifest.version)) {
    chrome.notifications.create('app:update', {
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: chrome.i18n.getMessage('notificationUpdated'),
      message: chrome.i18n.getMessage('notificationUpdatedDetail', [manifest.version])
    });
  }
});
