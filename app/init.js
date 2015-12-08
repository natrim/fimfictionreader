'use strict';

/*exported AppConfig*/

//CAN CHANGE HERE

var AppConfig = {
  name: 'FimFiction Reader', //name
  shortUrl: 'fimfiction.net/', //used for showing the url on settings
  url: 'https://www.fimfiction.net/', //used as prefix for browser and as default homepage
  domainLimit: 'fimfiction.net', //used for browset limit's
  partition: 'persist:fimfictionreader', //where to save cookies
  notifications: 'fimfiction', //notifications prefix
  homeReplacer: /https?\:\/\/((.*)\.)?fimfiction\.net\/?/, //for cleaning user defined home page
  userAgent: 'FimFictionReader', //browser user agent
  //applications user settings defaults
  settings: {
    toolbarType: 0, //0-auto,1-mac,2-win
    enableKeyboardShortcuts: true, //keybord shortcuts
    enableShiftToOpenWindow: true, //shift click to open link in chrome
    saveLastPage: true, //goto last page on app start instead of home
    homePage: '', //user set homepage (url+thissettings)
    lastUrl: '' //saved last url for next open
  }
};

// DON'T CHANGE BELLOW

chrome.app.runtime.onLaunched.addListener(function onLaunched() {
  chrome.app.window.create('index.html', {
    id: AppConfig.notifications + ':main',
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
  if (!e.previousVersion) {
    return;
  }

  var manifest = chrome.runtime.getManifest();

  if (('v' + e.previousVersion) !== ('v' + manifest.version)) {
    chrome.notifications.create(AppConfig.notifications + ':update', {
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: chrome.i18n.getMessage('notificationUpdated'),
      message: chrome.i18n.getMessage('notificationUpdatedDetail', [manifest.version])
    });
  }
});
