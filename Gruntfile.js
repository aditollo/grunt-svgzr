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
			tests: ['tmp', 'example/sass','example/sprite', 'test/result/**']
		},

		// Configuration to be run (and then tested).
		svgzr: {
			test: {
				options: {
					files: {
						cwdSvg: 'test/fixtures/svg/',
						cwdPng: "test/result/png/"
					},
					svg: {
						destFile: 'test/result/_svg.scss'
					},
					png: true,
					fallback : {
						mixinName: 'svg-fallback',
						destFile: 'test/result/_svg-fallback.scss'
					}
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
	grunt.registerTask('test', ['clean', 'svgzr:test', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
