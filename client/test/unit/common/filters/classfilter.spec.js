describe('class-filter', function() {
  var classFilter;

  beforeEach(module('filters.class-filter'));
  beforeEach(inject(function($injector) {
    classFilter = $injector.get('$filter')('classFilter');
  }));

  it('should filter aktivitet', function() {
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

  it('should filter resurs', function() {
    expect(classFilter([{
      resurs: 'a'
    }], 'b')).toEqual([]);
    expect(classFilter([{
      resurs: 'a'
    }, {
      resurs: 'b'
    }], 'B')).toEqual([{
      resurs: 'b'
    }]);
  });

  it('should filter lokal', function() {
    expect(classFilter([{
      lokal: 'a'
    }], 'b')).toEqual([]);
    expect(classFilter([{
      lokal: 'a'
    }, {
      lokal: 'b'
    }], 'B')).toEqual([{
      lokal: 'b'
    }]);
  });

  it('should filter startTime', function() {
    expect(classFilter([{
      startTime: 0
    }], 'monday')).toEqual([]);
    expect(classFilter([{
      startTime: 0
    }, {
      startTime: 123456789
    }], 'friday')).toEqual([{
      startTime: 123456789
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
