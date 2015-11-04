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

window.helpers.modal = function (selector, title, content, confirm, dialog, prompt) {
  confirm = confirm || false;
  prompt = prompt || false;
  var modal = jQuery(selector);
  if (modal) {
    modal.find('.header').html(title);
    if (prompt) {
      var input = '<label for="modaldialogpromptvalue">';
      input += content;
      input += '</label>';
      input += '<div class="ui fluid input">';
      input += '<input type="text" id="modaldialogpromptvalue" name="modaldialogpromptvalue">';
      input += '</div>';
      modal.find('.content .description').html(input);
      modal.off('keyup.prompt').on('keyup.prompt', '#modaldialogpromptvalue', function (e) {
        if (e.keyCode === 13) {
          modal.find('.positive').click();
        }
      });
    } else {
      modal.find('.content .description').html('<p>' + content + '</p>');
    }
    if (confirm || prompt) {
      modal.modal({
        closable: false,
        onDeny: function () {
          if (dialog) {
            dialog.cancel();
          }
        },
        onApprove: function () {
          if (dialog) {
            if (prompt) {
              dialog.ok(jQuery('#modaldialogpromptvalue').val().trim());
            } else {
              dialog.ok();
            }
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
