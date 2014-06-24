module.exports = function(config) {
  config.set({
    basePath: '../..',
    frameworks: ['jasmine'],
    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher'
    ],
    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-*/*.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/d3/d3.js',
      'bower_components/nvd3/nv.d3.js',
      'src/**/*.js',
      'test/unit/**/*.spec.js'
    ],
    reporters: ['progress'],
    port: 8089,
    urlRoot: '/__test/',
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true
  });
};
