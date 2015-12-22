'use strict';

/*globals window,jQuery*/

//define modal for alert/prompt/confirm dialogs
window.modal = function (selector, title, content, confirm, dialog, prompt) {
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
          modal.find('.ok').click();
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
      modal.find('.cancel').show();
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
      modal.find('.cancel').hide();
    }
  }
};
