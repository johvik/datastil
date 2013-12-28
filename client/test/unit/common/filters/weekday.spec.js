describe('weekday', function() {
  var weekday;

  beforeEach(module('filters.weekday'));
  beforeEach(inject(function($injector) {
    weekday = $injector.get('$filter')('weekday');
  }));

  it('should get weekday', function() {
    expect(weekday(0)).toBe('Sunday');
    expect(weekday(1)).toBe('Monday');
    expect(weekday(2)).toBe('Tuesday');
    expect(weekday(3)).toBe('Wednesday');
    expect(weekday(4)).toBe('Thursday');
    expect(weekday(5)).toBe('Friday');
    expect(weekday(6)).toBe('Saturday');
  });

  it('should not get weekday', function() {
    expect(weekday(7)).toBe('?');
    expect(weekday(-1)).toBe('?');
    expect(weekday(null)).toBe('?');
    expect(weekday([])).toBe('?');
  });
});
