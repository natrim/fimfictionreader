'use strict';

// This CSS class-based directive controls the pre-bootstrap loading screen. By
// default, it is visible on the screen; but, once the application loads, we'll
// fade it out and remove it from the DOM.
angular.module('fictionReader').directive(
  'mAppLoading', ['$animate', function mAppLoading($animate) {
    // I bind the JavaScript events to the scope.
    function link(scope, element, attributes) {
      // Due to the way AngularJS prevents animation during the bootstrap
      // of the application, we can't animate the top-level container; but,
      // since we added "ngAnimateChildren", we can animated the inner
      // container during this phase.
      // --
      // NOTE: Am using .eq(1) so that we don't animate the Style block.
      $animate.leave(element.children().eq(1)).then(
        function cleanupAfterAnimation() {
          // Remove the root directive element.
          element.remove();
          // Clear the closed-over variable references.
          scope = element = attributes = null;
        }
      );
    }

    // Return the directive configuration.
    return ({
      link: link,
      restrict: 'C'
    });
  }]);
