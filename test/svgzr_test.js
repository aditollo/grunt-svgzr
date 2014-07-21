'use strict';

var grunt = require('grunt');

/*
	======== A Handy Little Nodeunit Reference ========
	https://github.com/caolan/nodeunit

	Test methods:
		test.expect(numAssertions)
		test.done()
	Test assertions:
		test.ok(value, [message])
		test.equal(actual, expected, [message])
		test.notEqual(actual, expected, [message])
		test.deepEqual(actual, expected, [message])
		test.notDeepEqual(actual, expected, [message])
		test.strictEqual(actual, expected, [message])
		test.notStrictEqual(actual, expected, [message])
		test.throws(block, [error], [message])
		test.doesNotThrow(block, [error], [message])
		test.ifError(value)
*/

exports.svgzr = {
	setUp: function(done) {
		
		this.fixtures = {
			svgFolder : 'test/fixtures/svg/*.svg',
			svgClassPrefix: '.svg-'
		};

		this.fixtures.svgFiles = grunt.file.expand(this.fixtures.svgFolder);

		this.results = {
				svg : 'test/result/_svg.scss',
				pngFolder: 'test/result/png/',
				fallback: 'test/result/_svg-fallback.scss'
		};
		done();
	},
	generated_svg: function(test) {
		test.expect(1);

		test.ok(grunt.file.exists(this.results.svg), 'SVG Mixin file created');

		test.done();
	},
	generated_svg_contains_classes: function(test) {

		var svgClassPrefix = this.fixtures.svgClassPrefix;
		var svgFile = grunt.file.read(this.results.svg);

		test.expect(this.fixtures.svgFiles.length);

		this.fixtures.svgFiles.forEach(function(path) {
			var split = path.split('/');
			var classname = svgClassPrefix + split[split.length - 1].replace(/.svg$/, '');

			test.ok(svgFile.indexOf(classname) >= 0, 'For each svg there should be a svg mixin with the same name');
		});

		test.done();
	},
	generated_fallback: function(test) {
		
		test.expect(1);

		test.ok(grunt.file.exists(this.results.fallback), 'Fallback file created');

		test.done();
	},
	generated_fallback_contains_classes: function(test) {

		var svgClassPrefix = this.fixtures.svgClassPrefix;
		var fallback = grunt.file.read(this.results.fallback);

		test.expect(this.fixtures.svgFiles.length);

		this.fixtures.svgFiles.forEach(function(path) {
			var split = path.split('/');
			var classname = svgClassPrefix + split[split.length - 1].replace(/.svg$/, '');

			test.ok(fallback.indexOf(classname) >= 0, 'For each svg there should be a fallback mixin with the same name');
		});

		test.done();
	},
	generated_png: function(test) {
		var pngFolder = this.results.pngFolder;

		test.expect(2 + this.fixtures.svgFiles.length);

		test.ok(grunt.file.exists(this.results.pngFolder), 'Png dir created');
		test.ok(grunt.file.isDir(this.results.pngFolder), 'Png dir is actually a dir');

		this.fixtures.svgFiles.forEach(function(path) {
			var split = path.split('/');
			var file = split[split.length - 1].replace(/.svg$/, '.png');

			test.ok(grunt.file.exists(pngFolder + file), 'For each svg there should be an png with the same name');
		});

		test.done();
	},
};
