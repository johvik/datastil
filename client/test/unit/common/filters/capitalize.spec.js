describe('capitalize', function() {
  var capitalize;

  beforeEach(module('filters.capitalize'));
  beforeEach(inject(function($injector) {
    capitalize = $injector.get('$filter')('capitalize');
  }));

  it('should capitalize', function() {
    expect(capitalize('abc')).toBe('Abc');
    expect(capitalize('a')).toBe('A');
  });

  it('should not capitalize', function() {
    expect(capitalize('123')).toBe('123');
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe(null);
    expect(capitalize([])).toEqual([]);
  });
});
