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
			svgFolder : 'test/fixtures/svg/*.svg'
		};

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
		//var actual = grunt.file.read(svgResultFile);
		//var expected = grunt.file.read('test/expected/_svg.scss');

		//test.equal(actual, expected, 'The generated svg sass styles should be as expected');
		test.done();
	},
	generated_fallback: function(test) {
		test.expect(1);

		test.ok(grunt.file.exists(this.results.fallback), 'Fallback file created');

		test.done();
	},
	generated_png: function(test) {
		var svgs = grunt.file.expand(this.fixtures.svgFolder);
		var pngFolder = this.results.pngFolder;

		test.expect(2 + svgs.length);

		test.ok(grunt.file.exists(this.results.pngFolder), 'Png dir created');
		test.ok(grunt.file.isDir(this.results.pngFolder), 'Png dir is actually a dir');

		svgs.forEach(function(path) {
			var split = path.split('/');
			var file = split[split.length - 1].replace(/.svg$/, '.png');

			test.ok(grunt.file.exists(pngFolder + file), 'For each svg there should be an png with the same name');
		});

		test.done();
	},
};
