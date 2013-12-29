describe('class-filter', function() {
  var classFilter;

  beforeEach(module('filters.class-filter'));
  beforeEach(inject(function($injector) {
    classFilter = $injector.get('$filter')('classFilter');
  }));

  it('should filter array correctly', function() {
    expect(classFilter([{
      aktivitet: 'a'
    }], 'b')).toEqual([]);
    expect(classFilter([{
      aktivitet: 'a'
    }, {
      aktivitet: 'b'
    }], 'B')).toEqual([{
      aktivitet: 'b'
    }]);
  });

  it('should not filter array', function() {
    expect(classFilter([])).toEqual([]);
    expect(classFilter([{
      a: 'a'
    }])).toEqual([{
      a: 'a'
    }]);
  });
});
