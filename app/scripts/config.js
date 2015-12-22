'use strict';

/*globals chrome*/
/*exported AppConfig*/

var AppConfig = {
  name: 'FimFiction Reader', //name
  shortUrl: 'fimfiction.net/', //used for showing the url on settings
  url: 'https://www.fimfiction.net/', //used as prefix for browser and as default homepage
  domainLimit: 'fimfiction.net', //used for browser access limit's
  partition: 'persist:fimfictionreader', //where to save cookies
  homeReplacer: /https?\:\/\/((.*)\.)?fimfiction\.net\/?/, //for cleaning user defined home page
  userAgent: 'FimFictionReader/' + chrome.runtime.getManifest().version, //browser user agent
  findSelector: '#site-search input[name="search"]', //for ctrl+F shortcut to focus search input
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

AppConfig.translate = chrome.i18n.getMessage.bind(chrome.i18n);
