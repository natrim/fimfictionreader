/*globals _,window,Vue,jQuery*/

//modal component
(function createModalDialog() {
  'use strict';

  Vue.component('app-dialog', {
    template: document.querySelector('#dialogTemplate').import.body,
    ready: function () {
      //dialog init
      jQuery(this.$el).modal({
        detachable: false,
        autofocus: true
      });

      var openModal = null;

      //define modal for alert/prompt/confirm dialogs
      var modal = function (confirm, prompt, title, content, dialog) {
        confirm = confirm || false;
        prompt = prompt || false;
        content = content || '';
        var modal = jQuery(this.$el);
        if (modal) {
          if (openModal) {
            openModal.modal('hide');
            openModal = null;
          }
          _.defer(function () {
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
                closable: true,
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
                  openModal = null;
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
                  openModal = null;
                }
              });
              modal.find('.cancel').hide();
            }

            openModal = modal;

            modal.modal('show');
          });
          return modal;
        }
        return null;
      };

      window.confirm = modal.bind(this, true, false);
      window.prompt = modal.bind(this, false, true);
      window.alert = modal.bind(this, false, false);
    }
  });
})();
