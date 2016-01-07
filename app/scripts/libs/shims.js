/*exported exports,require*/
var exports = {};
var require;
(function registerExports() {
  'use strict';
  require = function require(name) {
    if (typeof exports[name] !== 'undefined') {
      return exports[name];
    }
    return undefined;
  };
})();
