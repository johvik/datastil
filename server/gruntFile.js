/*global module*/

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsbeautifier');

  // Project configuration.
  grunt.initConfig({
    nodeunit: ['test/**/*.js'],
    watch: {
      files: '<config:lint.files>',
      tasks: 'default timestamp'
    },
    jshint: {
      files: ['gruntFile.js', 'index.js', 'lib/*.js', 'test/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        globals: {
          require: false,
          __dirname: false,
          console: false,
          module: false,
          exports: false
        }
      }
    },
    jsbeautifier: {
      files: '<%= jshint.files %>',
      options: {
        html: {
          indentSize: 2,
          maxPreserveNewlines: 1
        },
        css: {
          indentSize: 2
        },
        js: {
          indentSize: 2
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'jsbeautifier']);

  grunt.registerTask('timestamp', function() {
    grunt.log.subhead(Date());
  });
};
