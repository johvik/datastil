describe('datastorage', function() {
  var dataStorage;

  beforeEach(module('services.data-storage'));
  beforeEach(inject(function($injector) {
    dataStorage = $injector.get('dataStorage');
  }));
  beforeEach(function() {
    localStorage.clear();
  });

  it('should store and load hidden groups data', function() {
    dataStorage.storeHiddenGroups([1, 2, 3]);
    expect(dataStorage.loadHiddenGroups()).toEqual([1, 2, 3]);
    dataStorage.storeHiddenGroups([]);
    expect(dataStorage.loadHiddenGroups()).toEqual([]);
  });

  it('should store and load search text data', function() {
    dataStorage.storeSearchText('abc');
    expect(dataStorage.loadSearchText()).toBe('abc');
    dataStorage.storeSearchText('');
    expect(dataStorage.loadSearchText()).toBe('');
  });
});
