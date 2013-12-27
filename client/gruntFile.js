module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-preprocess');

  // Default task.
  grunt.registerTask('default', ['jshint', 'build', 'karma:unit']);
  grunt.registerTask('build', ['env:dev', 'clean', 'html2js', 'concat', 'preprocess', 'recess:build', 'copy:assets']);
  grunt.registerTask('release', ['env:prod', 'clean', 'html2js', 'uglify', 'jshint', 'preprocess', 'recess:min', 'copy:assets', 'karma:unit']);
  grunt.registerTask('test-watch', ['karma:watch']);

  // Print a timestamp (useful for when watching)
  grunt.registerTask('timestamp', function() {
    grunt.log.subhead(Date());
  });

  var karmaConfig = function(configFile, customOptions) {
    var options = {
      configFile: configFile,
      keepalive: true
    };
    var travisOptions = process.env.TRAVIS && {
      browsers: ['Firefox', 'PhantomJS'],
      reporters: 'dots'
    };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  // Project configuration.
  grunt.initConfig({
    distdir: 'dist',
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
      ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
    src: {
      js: ['src/**/*.js'],
      jsTpl: ['<%= distdir %>/templates/**/*.js'],
      specs: ['test/**/*.spec.js'],
      scenarios: ['test/**/*.scenario.js'],
      html: ['src/index.html'],
      tpl: {
        app: ['src/app/**/*.tpl.html'],
        common: ['src/common/**/*.tpl.html']
      },
      css: ['src/css/stylesheet.css'], // recess:build doesn't accept ** in its file patterns
      cssWatch: ['src/css/**/*.css']
    },
    clean: ['<%= distdir %>/*'],
    copy: {
      assets: {
        files: [{
          dest: '<%= distdir %>',
          src: '**',
          expand: true,
          cwd: 'src/assets/'
        }]
      }
    },
    karma: {
      unit: {
        options: karmaConfig('test/config/unit.js')
      },
      watch: {
        options: karmaConfig('test/config/unit.js', {
          singleRun: false,
          autoWatch: true
        })
      }
    },
    html2js: {
      app: {
        options: {
          base: 'src/app'
        },
        src: ['<%= src.tpl.app %>'],
        dest: '<%= distdir %>/templates/app.js',
        module: 'templates.app'
      },
      common: {
        options: {
          base: 'src/common'
        },
        src: ['<%= src.tpl.common %>'],
        dest: '<%= distdir %>/templates/common.js',
        module: 'templates.common'
      }
    },
    concat: {
      dist: {
        options: {
          banner: "<%= banner %>"
        },
        src: ['<%= src.js %>', '<%= src.jsTpl %>'],
        dest: '<%= distdir %>/<%= pkg.name %>.js'
      },
      angular: {
        src: ['vendor/angular/angular.js', 'vendor/angular/*.js'],
        dest: '<%= distdir %>/angular.js'
      },
      angularlibs: {
        src: ['vendor/angular-libs/*.js'],
        dest: '<%= distdir %>/angular-libs.js'
      },
      bootstrap: {
        src: ['vendor/bootstrap/*.js'],
        dest: '<%= distdir %>/bootstrap.js'
      },
      nvd3: {
        src: ['vendor/nvd3/d3.v3.js', 'vendor/nvd3/nv.d3.js'],
        dest: '<%= distdir %>/nvd3.js'
      },
      jquery: {
        src: ['vendor/jquery/*.js'],
        dest: '<%= distdir %>/jquery.js'
      }
    },
    uglify: {
      dist: {
        options: {
          banner: "<%= banner %>"
        },
        // Merge all to one .js
        src: [
          //'<%= concat.jquery.src %>',
          //'<%= concat.angular.src %>',
          //'<%= concat.bootstrap.src %>',
          '<%= concat.angularlibs.src %>',
          '<%= concat.nvd3.src %>',
          '<%= src.js %>',
          '<%= src.jsTpl %>'
        ],
        dest: '<%= distdir %>/<%= pkg.name %>.js'
      }
    },
    recess: {
      build: {
        files: {
          '<%= distdir %>/<%= pkg.name %>.css': ['vendor/bootstrap/bootstrap.css', 'vendor/bootstrap/bootstrap-theme.css', 'vendor/nvd3/nv.d3.css', '<%= src.css %>']
        },
        options: {
          compile: true
        }
      },
      min: {
        files: {
          '<%= distdir %>/<%= pkg.name %>.css': ['vendor/nvd3/nv.d3.css', '<%= src.css %>']
        },
        options: {
          compress: true
        }
      }
    },
    watch: {
      all: {
        files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.cssWatch %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
        tasks: ['default', 'timestamp']
      },
      build: {
        files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.cssWatch %>', '<%= src.tpl.app %>', '<%= src.tpl.common %>', '<%= src.html %>'],
        tasks: ['build', 'timestamp']
      }
    },
    jshint: {
      files: ['gruntFile.js', '<%= src.js %>', '<%= src.jsTpl %>', '<%= src.specs %>', '<%= src.scenarios %>'],
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        globals: {}
      }
    },
    env: {
      dev: {
        BUILD_ENV: 'development'
      },
      prod: {
        BUILD_ENV: 'production'
      }
    },
    preprocess: {
      index: {
        src: ['src/index.html'],
        dest: '<%= distdir %>/index.html',
        options: {
          context: {
            name: '<%= pkg.name %>'
          }
        }
      }
    }
  });
};
