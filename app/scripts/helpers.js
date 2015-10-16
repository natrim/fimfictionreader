'use strict';

(function () {
  Vue.elementDirective('l', {
    bind: function () {
      this.el.innerText = window.chrome.i18n.getMessage(this.el.innerText);
    }
  });

  Vue.directive('l', {
    isLiteral: true,
    priority: 999999999,
    bind: function () {
      this.el.setAttribute(this.expression, chrome.i18n.getMessage(this.el.getAttribute(this.expression)));
    }
  });

  Vue.filter('l', function (value) {
    return chrome.i18n.getMessage(value);
  });
})();
