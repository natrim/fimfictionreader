/*global jQuery,window*/

(function ($, window, document) {
  'use strict';

  function radialMenu(el, checkCallback) {
    var radialSource = $(el || 'ul#radialmenu');

    if (radialSource.length <= 0) {
      console.error('No menu source defined!');
      return;
    }

    if (checkCallback) {
      var handleDisabledMenu = function handleDisabledMenu() {
        checkCallback(function () {
          //limit menu
          $.each($('.sectorlabel'), function (index, child) {
            if ($(child).find('a').hasClass('disabled')) {
              $('#sector' + index).addClass('disabled');
              $('#sectorlabel' + index).addClass('disabled');
            } else {
              $('#sector' + index).removeClass('disabled');
              $('#sectorlabel' + index).removeClass('disabled');
            }
          });
        });
      };
      setInterval(handleDisabledMenu, 1000);
    }

    var mouseX = 0;
    var mouseY = 0;
    var radialMidX = 0;
    var radialMidY = 0;
    var menuIsOpen = false;

    function computeRadial(isClick) {
      var deltax = mouseX - radialMidX;
      var deltay = -mouseY + radialMidY;
      var d = Math.sqrt(Math.pow(deltax, 2) + Math.pow(deltay, 2));
      //$('.sector').css('border-bottom-color', 'royalblue');
      $('.sector').removeClass('selected');
      $('.sectorlabel').removeClass('selected');
      if (d > 13) { // is 5 pixels a good amount to signify a drag evt
        $('.vertex').removeClass('selvertex');
        var r;
        if (deltay >= 0) {
          if (deltax >= 0) { // Q1
            r = (3 * Math.PI / 2) - Math.atan(deltay / deltax);
          } else { // Q2
            r = (Math.PI / 2) + Math.atan(deltay / (-deltax));
          }
        } else {
          if (deltax >= 0) { // Q4
            r = (3 * Math.PI / 2) + Math.atan((-deltay) / (deltax));
          } else { // Q3
            r = (Math.PI / 2) - Math.atan((-deltay) / (-deltax));
          }
        }
        var sang = (2 * Math.PI) / n;
        var matchwhichsector = Math.floor((r + (sang / 2)) / sang);
        if (matchwhichsector === n) { // because im dumb
          matchwhichsector = 0;
        }

        if (isClick) {
          var link = $('#sectorlabel' + matchwhichsector).find('a');
          if (!link.hasClass('disabled')) {
            link.get(0).click();
          }
        } else {
          $('#sector' + matchwhichsector).addClass('selected');
          $('#sectorlabel' + matchwhichsector).addClass('selected');
        }
      } else {
        $('.vertex').addClass('selvertex');
      }
    }

    $(document).off('touchcancel.radial').on('touchcancel.radial', function menuTC() {
      if (clicking) {
        clearTimeout(clicking);
        clicking = null;
      }
    });

    $(document).off('mousemove.radial touchmove.radial').on('mousemove.radial touchmove.radial', function menuMove(e) {
      if (clicking) {
        clearTimeout(clicking);
        clicking = null;
      }
      mouseX = e.pageX;
      mouseY = e.pageY;
      if (menuIsOpen) {
        computeRadial(false);
      }
    });

    var clicking = null;
    $(document).off('mouseup.radial touchend.radial').on('mouseup.radial touchend.radial', function menuMUp(e) {
      if (clicking) {
        clearTimeout(clicking);
        clicking = null;
      }
      mouseX = e.pageX;
      mouseY = e.pageY;
      if (menuIsOpen) {
        computeRadial(true);
        $('.radialmenu').removeClass('paused');
        menuIsOpen = false;
      }
    });

    $(document).off('contextmenu.radial').on('contextmenu.radial', function menuContextTriggerPreventer(e) {
      if (!e.altKey) { // ALT Right Click => Standard Context Menu
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    function openMenu(e) {
      var radial = $('.radialmenu');
      radial.css('top', e.pageY).css('left', e.pageX - w - 2);
      $('.sector').removeClass('selected');
      $('.sectorlabel').removeClass('selected');
      $('.vertex').addClass('selvertex');

      if (checkCallback) {
        handleDisabledMenu();
      }

      mouseX = e.pageX;
      mouseY = e.pageY;
      radial.css('top', e.pageY).css('left', e.pageX - w - 2);
      radialMidX = e.pageX;
      radialMidY = e.pageY;

      radial.addClass('paused');
      menuIsOpen = true;
    }

    $(document).off('touchstart.radial').on('touchstart.radial', function menuTS(e) {
      clicking = setTimeout(function () {
        clicking = null;
        openMenu(e);
      }, 500);
    });

    $(document).off('mousedown.radial').on('mousedown.radial', function menuMDown(e) {
      var isRightMB;
      e = e || window.event;
      if ('which' in e) {
        isRightMB = e.which === 3;
      } else if ('button' in e) {
        isRightMB = e.button === 2;
      }

      if (isRightMB) {
        if (!e.altKey) {
          openMenu(e);
          return false;
        }
      }
    });

    // here is init and build

    String.prototype.repeat = function (num) {
      return new Array(num + 1).join(this);
    };

    var radialResult = $('<div class="radialmenu">' + '<div class="sectors"></div>' + '<div class="sectorlabels"></div>' + '<div class="vertex">x</div>' + '<div class="trajectory"></div>' + '</div>');
    var n = radialSource.children().length;
    var radian = 2 * Math.PI;
    //var ia = radian / n;
    var oas = (Math.PI - (radian / n)) / 2;
    var c = 100; // constant hypothenuse length
    var h = c * Math.sin(oas);
    var w = Math.sqrt(Math.pow(c, 2) - Math.pow(h, 2));
    $.each(radialSource.children(), function (index, child) {
      radialResult.find('.sectors').append('<div class="sector" id="sector' + index + '"></div>');
      radialResult.find('.sectorlabels').append('<div class="sectorlabel" id="sectorlabel' + index + '"><div></div></div>');
      $(child).children().detach().appendTo(radialResult.find('#sectorlabel' + index + ' div'));
    });

    radialSource.replaceWith(radialResult);

    $('.sectorlabel').css('width', 2 * w + 'px');
    $('.sectorlabel').css('padding-top', (h - 30) + 'px');
    $('.sector').css('border-width', '0 ' + w + 'px ' + h + 'px ' + w + 'px');
    $('.vertex').css('left', w - 5 + 'px');

    $.each($('.sectors').children(), function (index, child) {
      var rot = index * (360 / n);
      $(child).css('-webkit-transform-origin', '50% 0%');
      $(child).css('-ms-transform-origin', '50% 0%');
      $(child).css('transform-origin', '50% 0%');
      $(child).css('-webkit-transform', 'rotate(' + rot + 'deg)');
      $(child).css('-ms-transform', 'rotate(' + rot + 'deg)');
      $(child).css('transform', 'rotate(' + rot + 'deg)');
    });

    $.each($('.sectorlabels').children(), function (index, child) {
      var rot = index * (360 / n);
      $(child).css('-webkit-transform-origin', '50% 0%');
      $(child).css('-ms-transform-origin', '50% 0%');
      $(child).css('transform-origin', '50% 0%');
      $(child).css('-webkit-transform', 'rotate(' + rot + 'deg)');
      $(child).css('-ms-transform', 'rotate(' + rot + 'deg)');
      $(child).css('transform', 'rotate(' + rot + 'deg)');
      if (90 < rot && rot < 270) {
        //$(child).childNodes()[0].css("-webkit-transform-origin", "50% 0%" );
        //$(child).css('top',h+'px)');
        $($(child).children()[0]).css('-webkit-transform', 'rotate(180deg)');
        $($(child).children()[0]).css('-ms-transform', 'rotate(180deg)');
        $($(child).children()[0]).css('transform', 'rotate(180deg)');
        //$(child).css('margin-top',-h-20+'px');
      }
    });
  }

  window.radialMenu = radialMenu;
})(jQuery, window, window.document);
