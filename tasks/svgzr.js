/*
 * grunt-svgzr
 * https://github.com/aditollo/grunt-svgzr
 *
 * Copyright (c) 2014 aditollo
 * Licensed under the MIT license.
 */

'use strict';



module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	grunt.file.defaultEncoding = 'utf8';
	grunt.file.preserveBOM = false;


	var svg2png = require('svg2png');
	var path = require('path');
	var eachAsync = require('each-async');
	var parseString = require('xml2js').parseString;
	var Mustache = require( path.join( '..', 'lib', 'mustache' ) );

	var putPx = function(dimension) {
		return dimension.indexOf('px') > -1 ? dimension : dimension + "px";
	};

	var cleanFolder = function(folderName) {
		var files = grunt.file.expand({
			cwd: folderName
		}, ['*.png']);
		files.forEach(function(file, i) {
			grunt.file.delete(path.join(folderName, file), {force:true});
		});
	};

	var checkTemplateFile = function(fileName) {
		if(grunt.file.isFile(fileName)) {
			return grunt.file.read(fileName);
		}
		else {
			grunt.fail.fatal("Missing template file: \"" + fileName + "\"");
//			grunt.log.subhead("Missing template file: \"" + fileName + "\". I'll proceed with the old json method");
			return null;
		}
	};

	var svgToPng = function(file, callback) {
		var srcPath = file.src[0];

		svg2png(srcPath, file.dest, function (err) {
			if( err ){
				grunt.fatal( err );
			}
			else {
				grunt.log.writeln('image converted from \"' + srcPath + '\" to \"' + file.dest + '\".');
			}
			callback();
		});

	};

	var svgToTemplate = function(file, options, data) {
		var srcSvg = grunt.file.read(file.src[0]);
		var baseName =  path.basename(file.src[0]);
		while (path.extname(baseName)!== ''){
			baseName = path.basename(baseName, path.extname(baseName));
		}
		var obj = {
			className: options.prefix + baseName,
			base64: new Buffer(srcSvg).toString('base64'),
			size: ""
		};
		parseString(srcSvg, function (err, result) {
			obj.width = result.svg.$.width;
			obj.height = result.svg.$.height;
		});
		if(obj.width && obj.height) {
			obj.width = putPx(obj.width);
			obj.height = putPx(obj.height);

		}
		data.allClasses += "." + obj.className;
		data.items.push(obj);
		grunt.log.writeln('template in base64 created from \"'+file.src[0]+'\"');
	};
	var pngToTemplate = function(file, options, data) {
		var baseName =  path.basename(file, data.ext);
		var obj = {
			className: options.prefix + baseName,
			mixinName: options.fallback.mixinName,
			dir: data.dir,
			lastDir: options.fallback.lastDir,
			fileName: baseName
		};
		data.items.push({
			className: options.prefix + baseName,
			fileName: baseName
		});
	};
	var firstCycle = function(options) {
		var converter = null;
		var svgData = {
			items: [],
			allClasses: ""
		};
		var filesSvg = grunt.file.expandMapping(['*.svg'], options.files.cwdPng, {
			cwd: options.files.cwdSvg,
			ext: '.png',
			extDot: 'first'
		});
		if(options.png && grunt.file.isDir(options.files.cwdSvg)) {
			cleanFolder(options.files.cwdPng);
		}
		eachAsync(filesSvg,function(file, i, next){
			// svg template
			if(options.svg) {
				svgToTemplate(file, options, svgData);
				svgData.allClasses += ((i===filesSvg.length-1) ? "" : ", ");
			}

			// svg to png
			if(options.png) {
				svgToPng(file, next);
			}
			else {
				next();
			}
		}, function(err){
			if(options.svg && filesSvg.length !== 0) {
				grunt.log.writeln("Writing svg template.");
				options.templateFileSvg = checkTemplateFile(options.templateFileSvg);
				var rendered = Mustache.render(options.templateFileSvg, svgData);
				grunt.file.write(options.svg.destFile, rendered);
			}
			if(options.fallback) {
				createFallback(options);
			}
			else {
				options.done();
			}

		});

	};
	var createFallback = function(options) {
		var fallbackData = {
			allClasses: "",
			items: [],
			dir: options.fallback.dir,
			lastDir: path.basename(options.fallback.dir),
			ext: '.png',
			mixinName: options.fallback.mixinName
		};
		var filesFallback = grunt.file.expand({
			cwd: options.files.cwdPng
		}, ['*'+ fallbackData.ext]);

		filesFallback.forEach(function(file, i) {
			pngToTemplate(file, options, fallbackData);
		});

		if(filesFallback.length !== 0) {
			grunt.log.writeln("Writing png fallback template.");
			options.templateFileFallback = checkTemplateFile(options.templateFileFallback);
			var rendered = Mustache.render(options.templateFileFallback, fallbackData);
			grunt.file.write(options.fallback.destFile, rendered);
		}
		options.done();
	};

	grunt.registerMultiTask('svgzr', 'Convert svg to png, and create templates for sass and compass with base64 svg and png.', function() {
		// Merge task-specific and/or target-specific options with these defaults.

		var options = this.options({
			files: {
				cwdSvg: 'svg/',
				cwdPng: "png/"
			},
			prefix: 'svg-',
			svg: false,
			fallback : false,
			png: false

		});
		if(!options.templateFileSvg) {
			options.templateFileSvg = path.join(__dirname, '..', 'test', 'templateSvg.mst');
		}
		if(!options.templateFileFallback) {
			options.templateFileFallback = path.join(__dirname, '..', 'test', 'templateFallback.mst');
		}
		if(options.fallback){
			if(!options.fallback.mixinName) {
				options.fallback.mixinName = 'svg-fallback';
			}
			if(!options.fallback.dir){
				options.fallback.dir = path.relative(path.dirname(options.fallback.destFile), options.files.cwdPng).split(path.sep).join('/') + '/';
			}
		}
		options.done = this.async();


		if(options.svg || options.png){
			firstCycle(options);
		}
		else if(options.fallback) {
			createFallback(options);
		}
		else {
			options.done();
		}

	});

};
