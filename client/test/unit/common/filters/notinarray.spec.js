describe('not-in-array', function() {
  var notInArray;

  beforeEach(module('filters.not-in-array'));
  beforeEach(inject(function($injector) {
    notInArray = $injector.get('$filter')('notInArray');
  }));

  it('should filter correctly', function() {
    expect(notInArray([1,2,3])).toEqual([1,2,3]);
    expect(notInArray([1,2,3], [])).toEqual([1,2,3]);
    expect(notInArray([1,2,3], [1,2,3])).toEqual([]);
    expect(notInArray([{a:1},{a:2},{a:3}], [2,3], 'a')).toEqual([{a:1}]);
    expect(notInArray([{a:1},{a:2},{a:3}], [2,3], 'b')).toEqual([{a:1},{a:2},{a:3}]);
  });
});
