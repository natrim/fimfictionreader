/*globals window,Vue,jQuery*/

//modal component
(function createModal() {
  'use strict';

  Vue.component('app-modal', {
    template: '<div class="ui small modal">' + '<i class="close icon"></i>' + '<div class="header">' + '<l>Alert</l>' + '</div>' + '<div class="content">' + '<div class="description">' + '<p>' + '</p>' + '</div>' + '</div>' + '<div class="actions">' + '<div class="ui cancel button">' + '<i class="remove icon"></i>' + '<l>Cancel</l>' + '</div>' + '<div class="ui grey ok button">' + '<i class="checkmark icon"></i>' + '<l>Ok</l>' + '</div>' + '</div>' + '</div>',
    ready: function () {
      //dialog init
      jQuery(this.$el).modal({
        detachable: false,
        autofocus: true
      });

      //define modal for alert/prompt/confirm dialogs
      var modal = function (confirm, prompt, title, content, dialog) {
        confirm = confirm || false;
        prompt = prompt || false;
        content = content || '';
        var modal = jQuery(this.$el);
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

          return modal.modal('show');
        }
        return null;
      };

      window.confirm = modal.bind(this, true, false);
      window.prompt = modal.bind(this, false, true);
      window.alert = modal.bind(this, false, false);
    }
  });
})();
