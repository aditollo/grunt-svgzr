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
    // setup here if necessary
    done();
  },
  generated_svg: function(test) {
    test.expect(1);

    var actual = grunt.file.read('test/result/_svg.scss');
    var expected = grunt.file.read('test/expected/_svg.scss');

    test.equal(actual, expected, 'The generated svg sass styles should be as expected');

    test.done();
  },
  generated_fallback: function(test) {
    test.expect(1);

    var actual = grunt.file.read('test/result/_svg-fallback.scss');
    var expected = grunt.file.read('test/expected/_svg-fallback.scss');
    test.equal(actual, expected, 'The generated svg fallback styles should be as expected');

    test.done();
  },
};
