module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    settings: grunt.file.readJSON('config.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author ? pkg.author.name : "" %>*/\n',
    /*
      SASS
      ===================
      $ grunt
      $ grunt sass
      ===================

      Compiles SASS into a single CSS file in the source folder
    */
    sass: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= settings.srcPath%>/sass', // Source path
          src: ['**/*.scss', '!critical.scss'], // SASS cfiles
          dest: '<%= settings.srcPath%>/css', // Build path
          ext: '.css' // Extension
        },
        {
          expand: true,
          cwd: '<%= settings.srcPath%>/sass', // Source path
          src: ['critical.scss'], // SASS cfiles
          dest: '<%= settings.srcPath%>/css', // Build path
          ext: '.css' // Extension
        }]
      }
    },
    /*
      CONCAT
      ===================
      $ grunt
      $ grunt concat
      ===================
      
      Compiles SASS into a single CSS file in the source folder
    */
    concat: {
      options: {
        banner: '<%= banner %>' // Add banner to the CSS files
      },
      css: {
        src: ['<%= settings.srcPath%>/**/*.css','!<%= settings.srcPath%>/css/critical.css'], // Source files
        dest: '<%= settings.buildPath%>/css/<%= pkg.name %>.css' // Build file
      }
    },
    /*
      UGLIFY
      ===================
      $ grunt
      $ grunt uglify
      ===================
      
      Concats and compresses JavaScript files
    */
    uglify: {
      options: {
        banner: '<%= banner %>' // Add banner to the JS files
      },
      dist: {
        src: [ '<%= settings.srcPath%>/js/vendor/jquery-1.11.2.min.js', '<%= settings.srcPath%>/**/*.js', '!<%=settings.srcPath%>/js/vendor/modernizr-2.8.3.min.js'], // Source files, ignore modernizer and HTML shiv as they need to be loaded separately
        dest: '<%= settings.buildPath%>/js/<%= pkg.name %>.min.js' // Build file
      }
    },
    /*
      CSSMIN
      ===================
      $ grunt
      $ grunt cssmin
      $ grunt concat cssmin
      ===================
      
      Minifies CSS files. Best used in conjunction with grunt concat
    */
    cssmin: {
      dist: {
        files: [{
          expand: true, 
          cwd: '<%= settings.buildPath%>', // Source path
          src: ['**/*.css', '!**/*.min.css','!<%= settings.srcPath%>/css/critical.css'], // Source files
          dest: '<%= settings.buildPath%>', // Build path
          ext: '.min.css' // Build ifle
        }]
      },
      critical: {
        files: {
          '<%= settings.buildPath%>/css/critical.min.css': '<%= settings.srcPath%>/css/critical.css'
        }
      }
    },
    /*
      IMAGEMIN
      ===================
      $ grunt
      $ grunt imagemin
      ===================
      
      Compresses JPEG, PNG, and GIF files 
    */
    imagemin: {
      dynamic: { 
        files: [{
          expand: true, // Enable dynamic expansion
          cwd: '<%= settings.srcPath%>', // Source path
          src: ['**/*.{png,jpg,gif}'], // Source files
          dest: '<%= settings.buildPath%>' // Build path
        }]
      }
    },
    /*
      PROCESSHTML
      ===================
      $ grunt
      $ grunt processhtml
      ===================
      
      Creates build files that remove any reference to source files
    */
    processhtml: {
      options: {
        data: {
          process: true,
          packagename: '<%=pkg.name%>' // Replace package name
        }
      },
      dist:{
        files: [
        {
          expand: true,
          cwd: '<%= settings.srcPath%>', // Source path
          src: ['**/*.html'], // Source files
          dest: '<%= settings.buildPath%>', // Build path
          ext: '.html' // Extension
        }
        ]
      }
    },
    /*
      WATCH
      ===================
      $ grunt watch
      ===================
      
      Watches for any SASS changes and reloads browser instantly. Not included in default grunt tasks.
    */
    watch: {
      css: {
        files: ['<%= settings.srcPath%>/**/*.scss','<%= settings.srcPath%>/**/*.js','<%= settings.srcPath%>/**/*.html','<%= settings.srcPath%>/**/*.csv'], // Source files
        tasks: ['sass', 'jshint', 'htmlmin'], // Tasks to execute
        options: {
          livereload: true, // Live browser reload
        },
      },
    },
    /*
      CLEAN
      ===================
      $ grunt 
      $ grunt clean
      ===================
      
      Removes any unnecessary source files from the build directory
    */
    clean: {
      stylesheets: {
        src: [ '<%= settings.buildPath%>/**/*.css', '!<%= settings.buildPath%>/css/<%= pkg.name %>.min.css', '<%= settings.buildPath%>/css/critical.min.css', '<%= settings.buildPath%>/css/critical.css.map' ] // Any CSS file, but not minified ones
      },
      scripts: {
        src: [ '<%= settings.buildPath%>/**/*.js', '!<%= settings.buildPath%>/js/<%= pkg.name %>.min.js', '!<%=settings.buildPath%>/js/vendor/modernizr-2.8.3.min.js'] // Any CSS file, but not modernizer, package file, or HTML5 shiv
      },
      sass: {
        src: [ '<%= settings.buildPath%>/sass' ] // SASS folder
      },
      map: {
        src: [ '<%= settings.buildPath%>/**/*.map' ] // MAP documents
      }
    },
    /*
      CLEAN
      ===================
      $ grunt 
      $ grunt clean
      ===================
      
      Watches for any SASS changes and reloads browser instantly
    */
    copy: {
      build: {
        cwd: '<%= settings.srcPath%>', // Source path
        src: [ '**', '!**/*.sass', '!**/*.html', '!**/*.{png,jpg,gif}' ], // Source files
        dest: '<%= settings.buildPath%>', // Build path
        expand: true
      },
    },
    /*
      JSBEAUTIFIER
      ===================
      $ grunt 
      $ grunt jsbeautifier
      ===================
      
      Tidies up source CSS and JS files
    */
    jsbeautifier : {
      files : ['<%= settings.srcPath%>/**/*.scss', '<%= settings.srcPath%>/**/*.css', '<%= settings.srcPath%>/**/*.js','!<%= settings.srcPath%>/**/*.min.js'],
      options: {
        css: {
            fileTypes: ['.scss'] // Include SASS files, not just CSS files
        }
      }
    },
    /*
      SIZE_REPORT
      ===================
      $ grunt 
      $ grunt size_report
      ===================
      
      Generates a file size report
    */
    size_report: {
      base: {
        files: {
          list: ['<%= settings.buildPath%>/**/*.*','!<%= settings.buildPath%>/**/*.map'] 
        }
      }
    },
    /*
      JSHINT
      ===================
      $ grunt 
      $ grunt jshint
      ===================
      
      Checks JS code for syntax errors and other problems
    */
    jshint: {
      options: {
        globals: {
          jQuery: true
        }
      },
      all: ['<%= settings.srcPath%>/**/*.js', '!<%= settings.srcPath%>/**/*.min.js']
    },
    /*
      CLEANEMPTY
      ===================
      $ grunt 
      $ grunt cleanempty
      ===================
      
      Cleans out empty folders and files
    */
    cleanempty: {
      dist: {
        src: ['<%= settings.buildPath%>/**/*']
      } 
    },
    ftp_push: {
      dev: {
        options: {
          authKey: 'dev',
          host: '<%=settings.dev.ftpHost%>',
          dest: '<%=settings.dev.ftpPath%>',
          port: '<%=settings.dev.ftpPort%>'
        },     
        files: [
        {
          expand: true,
          cwd: '<%=settings.buildPath%>',
          src: ['**/*'],
          dest: '/'
        }
        ]
      }
    },
    open : {
      dev : {
        path: '<%=settings.dev.url%>'
      }
    },
    htmlmin: {
      dev: {
        options: {
            removeComments: true,
            collapseWhitespace: false
        },
        files: [
          {
            expand: true, 
            cwd: '<%= settings.buildPath%>', // Build directory
            src: ['**/*.html'], // HTML files
            dest: '<%= settings.buildPath%>'
        }],
      }
    },
  });

  // Include grunt plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-size-report');
  grunt.loadNpmTasks('grunt-cleanempty');
  grunt.loadNpmTasks('grunt-ftp-push');
  grunt.loadNpmTasks('grunt-open');

  // Default task.
  grunt.registerTask('default', ['sass', 'jsbeautifier', 'concat', 'uglify', 'cssmin', 'processhtml', 'imagemin', 'copy', 'clean','jshint', 'cleanempty', 'htmlmin','size_report']);
  grunt.registerTask('ftp', ['default', 'ftp_push', 'open']);
};
