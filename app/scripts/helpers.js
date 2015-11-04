'use strict';

(function () {
  Vue.elementDirective('l', {
    bind: function () {
      this.el.innerText = window.chrome.i18n.getMessage(this.el.innerText);
    }
  });

  Vue.directive('l', {
    priority: 999999999,
    update: function (values) {
      for (var i in values) {
        this.el.setAttribute(values[i].trim(), window.chrome.i18n.getMessage(this.el.getAttribute(values[i].trim())));
      }
    }
  });

  Vue.filter('l', function (value) {
    return window.chrome.i18n.getMessage(value);
  });
})();

window.helpers = {};

window.helpers.modal = function (selector, title, content, confirm, dialog) {
  confirm = confirm || false;
  var modal = jQuery(selector);
  if (modal) {
    modal.find('.header').html(title);
    modal.find('.content .description p').html(content);
    if (confirm) {
      modal.modal({
        closable: false,
        onDeny: function () {
          if (dialog) {
            dialog.cancel();
          }
        },
        onApprove: function () {
          if (dialog) {
            dialog.ok();
          }
        },
        onHidden: function () {
          if (dialog) {
            dialog.cancel();
          }
        }
      });
      modal.find('.negative').show();
    } else {
      modal.modal({
        closable: false,
        onDeny: function () {
          if (dialog) {
            dialog.cancel();
          }
        },
        onApprove: function () {
          if (dialog) {
            dialog.cancel();
          }
        },
        onHidden: function () {
          if (dialog) {
            dialog.cancel();
          }
        }
      });
      modal.find('.negative').hide();
    }
  }
};
