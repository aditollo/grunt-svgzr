/*
 * grunt-svgzr
 * https://github.com/aditollo/grunt-svgzr
 *
 * Copyright (c) 2014 aditollo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp', 'example/sass']
    },

    // Configuration to be run (and then tested).
    svgzr: {
		dist: {
			options: {
				templateFile: 'example/template.json',
				files: {
					cwdSvg: 'example/icons/svg/',
					cwdPng: "example/sprite/fallback/"
				},
				prefix: 'svg-',
				svg: {
					destFile: 'example/sass/common/_icons.scss'
				},
				png: true,
//					png: {
//						type: 'svg2png'
//					},
				fallback : {
					mixinName: 'svg-fallback',
					dir: 'fallback/',
					destFile: 'example/sass/common/_icons-fallback.scss'
				}

			}
		},
      default_options: {
        options: {
        },
        files: {
          'tmp/default_options': ['test/fixtures/testing', 'test/fixtures/123']
        }
      },
      custom_options: {
        options: {
          separator: ': ',
          punctuation: ' !!!'
        },
        files: {
          'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'svgzr:dist', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
