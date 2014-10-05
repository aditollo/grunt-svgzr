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

	var checkTemplateFile = function(fileName) {
		if(grunt.file.isFile(fileName)) {
			return grunt.file.read(fileName);
		}
		else {
//			grunt.fail.fatal("Missing template file: \"" + fileName + "\"");
			grunt.log.subhead("Missing template file: \"" + fileName + "\". I'll proceed with the old json method");
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

			data.resultItemVars += grunt.template.process(data.template.itemVarsTemplate, {data: obj});
			obj.size = grunt.template.process(data.template.sizeTemplate, {data: obj});
		}
		data.allClasses += "." + obj.className;
		data.items.push(obj);
		data.resultItem += grunt.template.process(data.template.itemTemplate, {data: obj});
		grunt.log.writeln('template in base64 created from \"'+file.src[0]+'\"');
	};
	var pngToTemplate = function(file, data) {
		var baseName =  path.basename(file, data.generalObj.ext);
		var obj = {
			className: data.generalObj.prefix + baseName,
			mixinName: data.generalObj.mixinName,
			dir: data.generalObj.dir,
			lastDir: data.generalObj.lastDir,
			fileName: baseName
		};
		data.resultItemVars += grunt.template.process(data.template.itemVarsTemplate, {data: obj});
		data.resultAllItems += grunt.template.process(data.template.itemTemplate, {data: obj}) + "\n";
	};
	var firstCycle = function(options) {
		var converter = null;
		var svgData = {
			resultImports : "",
			resultItemVars : "",
			resultGeneral : "",
			resultItem : "",
			resultAllItems : "",
			items: [],
			allClasses: "",
			template: options.templateFile.svg
		};
		var filesSvg = grunt.file.expandMapping(['*.svg'], options.files.cwdPng, {
			cwd: options.files.cwdSvg,
			ext: '.png',
			extDot: 'first'
		});
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
				if(options.templateFileSvg) {
					var rendered = Mustache.render(options.templateFileSvg, svgData);
					grunt.file.write(options.svg.destFile, rendered);
				}
				else {
				svgData.resultImports = grunt.template.process(svgData.template.importsTemplate, {data: {allClasses: svgData.allClasses}});
				svgData.resultAllItems = grunt.template.process(svgData.template.allItemsTemplate, {data: {allClasses: svgData.allClasses}});
				grunt.file.write(options.svg.destFile, svgData.resultImports +  svgData.resultItemVars + "\n" + svgData.resultItem + svgData.resultAllItems + "\n\n");
				}
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
			resultImports : "",
			resultItemVars : "",
			resultGeneral : "",
			resultItem : "",
			resultAllItems : "",
			allClasses: "",
			template: options.templateFile.fallback,
			generalObj : {
				prefix: options.prefix,
				dir: options.fallback.dir,
				lastDir: path.basename(options.fallback.dir),
				ext: '.png',
				mixinName: options.fallback.mixinName
			}
		};

		var filesFallback = grunt.file.expand({
			cwd: options.files.cwdPng
		}, ['*'+ fallbackData.generalObj.ext]);

		filesFallback.forEach(function(file, i) {
			pngToTemplate(file, fallbackData);
		});
		if(filesFallback.length !== 0) {
			fallbackData.resultImports = grunt.template.process(fallbackData.template.importsTemplate, {data: fallbackData.generalObj});
			fallbackData.resultGeneral = grunt.template.process(fallbackData.template.generalTemplate, {data: fallbackData.generalObj});
			grunt.log.writeln("Writing png fallback template.");
			grunt.file.write(options.fallback.destFile, fallbackData.resultImports + fallbackData.resultItemVars + "\n" + fallbackData.resultGeneral + "\n\n" + fallbackData.resultAllItems);
		}
		options.done();
	};

	grunt.registerMultiTask('svgzr', 'Convert svg to png, and create templates for sass and compass with base64 svg and png.', function() {
		// Merge task-specific and/or target-specific options with these defaults.

		var options = this.options({
			templateFile: './test/template.json',
			templateFileSvg: './test/templateSvg.mst',
			templateFilePng: './test/templatePng.mst',
			files: {
				cwdSvg: 'svg/',
				cwdPng: "png/"
			},
			prefix: 'svg-',
			svg: false,
			fallback : false,
			png: false

		});

//		options.templateFilePng = checkTemplateFile(options.templateFilePng);

		if(grunt.file.isFile(options.templateFile)) {
			options.templateFile = grunt.file.readJSON(options.templateFile);
		}
		else {
			options.templateFile = {
				"svg" : {
					"importsTemplate": "",
					"generalVarsTemplate": "",
					"itemVarsTemplate": "$<%= className %>-width: <%= width %>;\n$<%= className %>-height: <%= height %>;\n",
					"generalTemplate": "",
					"itemTemplate": ".<%= className %> {\n\tbackground-image: url('data:image/svg+xml;base64,<%= base64 %>');\n<%= size %>}\n\n",
					"allItemsTemplate": "<%= allClasses %> {\n\tbackground-repeat: no-repeat;\n}",
					"sizeTemplate": "\twidth: $<%= className %>-width;\n\theight: $<%= className %>-height;\n"
				},
				"fallback" : {
					"importsTemplate": "@import 'compass/utilities/sprites';\n@import '<%= dir %>*<%= ext %>';\n\n",
					"generalVarsTemplate": "",
					"itemVarsTemplate": "",
					"generalTemplate": "// Helper for svg fallbacks (ie8 and lower/unsupported browsers)\n@mixin <%= mixinName %>($fileName){\n\t.no-svg &, .ielt9 & {\n\t\t@include <%= lastDir %>-sprite($fileName);\n\t\twidth: <%= lastDir %>-sprite-width($fileName);\n\t\theight: <%= lastDir %>-sprite-height($fileName);\n\t}\n}\n",
					"itemTemplate": ".<%= className %> {\n\t@include <%= mixinName %>(<%= fileName %>);\n}\n",
					"allItemsTemplate": ""
				}
			};
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
