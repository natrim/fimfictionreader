(function () {
  'use strict';

  angular.module('fictionReader')

  .filter('groupByFirstLetter', function () {

    var dividers = {};

    return function (input) {
      if (!input || !input.length) {
        return;
      }

      var output = [],
        previousLetter,
        currentLetter,
        item;

      for (var i = 0, ii = input.length; i < ii && (item = input[i]); i++) {
        currentLetter = item.title.substr(0, 1);
        if (!previousLetter || currentLetter !== previousLetter) {
          var dividerId = currentLetter;
          if (!dividers[dividerId]) {
            dividers[dividerId] = {
              isDivider: true,
              divider: currentLetter
            };
          }

          output.push(dividers[dividerId]);
        }
        output.push(item);
        previousLetter = currentLetter;
      }

      return output;
    };
  })

  .directive('dividerCollectionRepeat', function () {
    function compile(element, attr) {
      var height = attr.itemHeight || '53';
      attr.$set('itemHeight', 'item.isDivider ? 37 : ' + height);

      element.children().attr('ng-hide', 'item.isDivider');
      element.prepend(
        '<div class="item item-divider ng-hide" ng-show="item.isDivider" ng-bind="item.divider"></div>'
      );
    }

    return {
      priority: 1001,
      compile: compile
    };
  });

})();
