angular.module('directives.line-chart', [])

.directive('lineChart', [

  function() {
    return {
      restrict: 'E',
      scope: {
        data: '=',
        height: '@',
        xtickformat: '&',
        ytickformat: '&',
        forcex: '@',
        forcey: '@'
      },
      link: function(scope, element, attrs) {
        var svg = d3.select(element[0])
          .append('svg')
          .attr('width', '100%')
          .attr('height', scope.height);

        scope.$watch('data', function(val, old) {
          return scope.render(val);
        }, true);

        var chart = null;
        scope.render = function(data) {
          // Clear previous rendering
          svg.selectAll("*").remove();
          if (!chart) {
            // Initialize
            nv.addGraph(function() {
              chart = nv.models.lineChart()
                .margin({
                  top: 50,
                  right: 50,
                  bottom: 50,
                  left: 50
                });

              if (attrs.xtickformat) {
                chart.xAxis
                  .tickFormat(scope.xtickformat());
              }

              if (attrs.ytickformat) {
                chart.yAxis
                  .tickFormat(scope.ytickformat());
              }

              if (attrs.forcex) {
                chart.forceX(scope.$eval(attrs.forcex));
              }

              if (attrs.forcey) {
                chart.forceY(scope.$eval(attrs.forcey));
              }

              svg.datum(data)
                .transition().duration(500)
                .call(chart);

              nv.utils.windowResize(chart.update);
              return chart;
            });
          } else {
            // Just update data
            svg.datum(data)
              .call(chart);
          }
        };
      }
    };
  }
]);
