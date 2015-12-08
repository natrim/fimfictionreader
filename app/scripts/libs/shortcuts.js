'use strict';

/*globals _,window,chrome*/
/*exported createShortcuts*/

var AppShortcutsInstance;

function createShortcuts() {
  if (AppShortcutsInstance) {
    return AppShortcutsInstance;
  }

  function l(value) {
    return chrome.i18n.getMessage(value);
  }

  function AppShortcuts() {
    this.shortcuts = {
      back: [
        {
          key: 166,
          forced: true,
          description: l('shortcut_key_browser_back')
        },
        {
          key: 37,
          alt: true,
          description: l('shortcut_key_alt') + ' + ' + l('shortcut_key_arrow_left')
        },
        {
          key: 37,
          meta: true,
          description: l('shortcut_key_meta') + ' + ' + l('shortcut_key_arrow_left')
        }
      ],
      forward: [
        {
          key: 167,
          forced: true,
          description: l('shortcut_key_browser_forward')
        },
        {
          key: 39,
          alt: true,
          description: l('shortcut_key_alt') + ' + ' + l('shortcut_key_arrow_right')
        },
        {
          key: 39,
          meta: true,
          description: l('shortcut_key_meta') + ' + ' + l('shortcut_key_arrow_right')
        }
      ],
      top: [
        {
          key: 38,
          alt: true,
          description: l('shortcut_key_alt') + ' + ' + l('shortcut_key_arrow_up')
        },
        {
          key: 38,
          meta: true,
          description: l('shortcut_key_meta') + ' + ' + l('shortcut_key_arrow_up')
        }
      ],
      reload: [
        {
          key: 168,
          forced: true,
          description: l('shortcut_key_browser_reload')
        },
        {
          key: 40,
          alt: true,
          description: l('shortcut_key_alt') + ' + ' + l('shortcut_key_arrow_down')
        },
        {
          key: 40,
          meta: true,
          description: l('shortcut_key_meta') + ' + ' + l('shortcut_key_arrow_down')
        },
        {
          key: 82,
          alt: true,
          description: l('shortcut_key_alt') + ' + R'
        },
        {
          key: 82,
          meta: true,
          description: l('shortcut_key_meta') + ' + R'
        }
      ],
      settings: [
        {
          key: 80,
          ctrl: true,
          description: l('shortcut_key_ctrl') + ' + P'
        },
        {
          key: 80,
          meta: true,
          description: l('shortcut_key_meta') + ' + P'
        },
        {
          key: 188,
          ctrl: true,
          description: l('shortcut_key_ctrl') + ' + ,'
        },
        {
          key: 188,
          meta: true,
          description: l('shortcut_key_meta') + ' + ,'
        }
      ],
      find: [
        {
          key: 70,
          ctrl: true,
          description: l('shortcut_key_ctrl') + ' + F'
        },
        {
          key: 70,
          meta: true,
          description: l('shortcut_key_meta') + ' + F'
        }
      ],
      fullscreen: [
        {
          key: 70,
          ctrl: true,
          alt: true,
          description: l('shortcut_key_ctrl') + ' + ' + l('shortcut_key_alt') + ' + F'
        },
        {
          key: 70,
          ctrl: true,
          meta: true,
          description: l('shortcut_key_ctrl') + ' + ' + l('shortcut_key_meta') + ' + F'
        }
      ]
    };
  }

  AppShortcuts.prototype.bind = function bindShortcuts(settings, browser, toolbar) {
    var controls = browser.getControls();

    function doShortcut(action) {
      switch (action) {
      case 'back':
        controls.back();
        break;
      case 'forward':
        controls.forward();
        break;
      case 'reload':
        controls.reload();
        break;
      case 'top':
        controls.top();
        break;
      case 'settings':
        var mod = jQuery('.settingsTrigger').get(0);
        if (mod) {
          mod.click();
        }
        break;
      case 'fullscreen':
        toolbar.fullscreen();
        break;
      case 'find':
        browser.exec('if(typeof jQuery !== \'undefined\'){jQuery(\'#site-search input[name="search"]\').val(\'\').focus();jQuery(\'html, body\').animate({scrollTop : 0}, 500);}else{window.scrollTo(0, 0);document.querySelector(\'#site-search input[name="search"]\').focus();}');
        break;
      }
    }

    window.addEventListener('keydown', function shortcutsEvent(e) {
      _.each(this.shortcuts, function (sh, action) {
        _.each(sh, function (shortcut) {
          if (e.keyCode === shortcut.key && (e.shiftKey === shortcut.shift || (e.shiftKey === false && shortcut.shift === undefined)) && (e.altKey === shortcut.alt || (e.altKey === false && shortcut.alt === undefined)) && (e.metaKey === shortcut.meta || (e.metaKey === false && shortcut.meta === undefined)) && (e.ctrlKey === shortcut.ctrl || (e.ctrlKey === false && shortcut.ctrl === undefined))) {
            if (settings.enableKeyboardShortcuts || shortcut.forced) {
              doShortcut(action);
            }
          }
        });
      });
    }.bind(this));
  };

  AppShortcutsInstance = new AppShortcuts();
  return AppShortcutsInstance;
}
