'use strict';

/*global jQuery,window*/

(function ($, window, document) {
  function radialMenu(checkCallback) {
    var radialSource = $('ul#radialmenu');

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
    //var currentRadialSelected = null;
    var canMove = true;

    function computeRadial(isRightMB, isClick) {
      if (isRightMB) {
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
            if (!$('#sectorlabel' + matchwhichsector).find('a').hasClass('disabled')) {
              $('#sectorlabel' + matchwhichsector).find('a').get(0).click();
            }
          } else {
            $('#sector' + matchwhichsector).addClass('selected');
            $('#sectorlabel' + matchwhichsector).addClass('selected');
          }
        } else {
          $('.vertex').addClass('selvertex');
        }
      }
    }


    $(document).off('mousemove.radialMenu').on('mousemove.radialMenu', function menuMove(e) {
      mouseX = e.pageX;
      mouseY = e.pageY;
      if (canMove) {
        $('div.radialmenu').css('top', e.pageY).css('left', e.pageX - w - 2);
        radialMidX = e.pageX;
        radialMidY = e.pageY;
      }

      if (!canMove) {
        var isRightMB;
        e = e || window.event;
        if ('which' in e) {
          isRightMB = e.which === 3;
        } else if ('button' in e) {
          isRightMB = e.button === 2;
        }

        computeRadial(isRightMB, false);
      }
    });

    $(document).off('mouseup.radialMenu').on('mouseup.radialMenu', function menuMUp(e) {
      mouseX = e.pageX;
      mouseY = e.pageY;
      if (!canMove) {
        var isRightMB;
        e = e || window.event;
        if ('which' in e) {
          isRightMB = e.which === 3;
        } else if ('button' in e) {
          isRightMB = e.button === 2;
        }

        computeRadial(isRightMB, true);
        canMove = true;
        $('.radialmenu').removeClass('paused');
      }
    });

    $(document).off('contextmenu.radialMenu').on('contextmenu.radialMenu', function menuContextTriggerPreventer(e) {
      if (!e.altKey) { // ALT Right Click => Standard Context Menu
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    $(document).off('mousedown.radialMenu').on('mousedown.radialMenu', function menuMDown(e) {
      var isRightMB;
      e = e || window.event;
      if ('which' in e) {
        isRightMB = e.which === 3;
      } else if ('button' in e) {
        isRightMB = e.button === 2;
      }

      if (isRightMB && !e.altKey) {
        if (canMove) {
          canMove = false;
          $('.sector').removeClass('selected');
          $('.sectorlabel').removeClass('selected');
          $('.vertex').addClass('selvertex');

          if (checkCallback) {
            handleDisabledMenu();
          }

          setTimeout(function () {
            $('.radialmenu').addClass('paused');
          }, 10);
        } else {
          canMove = true;
          setTimeout(function () {
            $('.radialmenu').removeClass('paused');
          }, 10);
        }
        return false;
      }
    });

    // here is init and build

    String.prototype.repeat = function (num) {
      return new Array(num + 1).join(this);
    };

    var radialResult = $('<div class="radialmenu">' + '<div class="sectors"></div>' + '<div class="sectorlabels"></div>' + '<div class="vertex" title="Hold Alt while right clicking for context menu">x</div>' + '<div class="trajectory"></div>' + '</div>');
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
