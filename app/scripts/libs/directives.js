'use strict';

/*globals AppConfig,Vue,jQuery*/

//translations element
(function createVueDirectives() {
  Vue.elementDirective('l', {
    bind: function () {
      var $el = jQuery(this.el);
      $el.html(AppConfig.translate($el.text().trim()));
    }
  });

  //translations directive
  Vue.directive('l', {
    priority: 999999999,
    update: function (values) {
      var $el = jQuery(this.el);
      for (var i in values) {
        $el.attr(values[i].trim(), AppConfig.translate($el.attr(values[i].trim()).trim()));
      }
    }
  });

  //translation filter
  Vue.filter('l', function (value) {
    return AppConfig.translate(value);
  });
})();
