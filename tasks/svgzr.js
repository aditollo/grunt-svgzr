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

	var gm = require('gm');
	var svg2png = require('svg2png');
	var path = require('path');
	var eachAsync = require('each-async');
	var parseString = require('xml2js').parseString;

	var svgToPng = function(file, data) {
		var srcPath = file.src[0];
		if(data.type === "im" || data.type === "gm") {
			data.converter(srcPath).write(file.dest, function (err) {
				if (!err) {
					grunt.log.writeln('image converted from \"' + srcPath + '\" to \"' + file.dest + '\".');
					return true;
				}
				else {
					grunt.log.writeln("" + err);
					return false;
				}
			});
		}
		else if(data.type === "svg2png") {
			svg2png(srcPath, file.dest, function (err) {
				if( err ){
					grunt.fatal( err );
				}
			});
		}
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
			obj.width = (obj.width.indexOf('px') > -1) ? obj.width : obj.width + "px";
			obj.height = (obj.height.indexOf('px') > -1) ? obj.height : obj.height + "px";

			data.resultItemVars += grunt.template.process(data.template.itemVarsTemplate, {data: obj});
			obj.size = grunt.template.process(data.template.sizeTemplate, {data: obj});
		}
//		data.allClasses += ((i===0) ? "" : ", ") + "." + obj.className;
		data.allClasses += "." + obj.className;
		data.resultItem += grunt.template.process(data.template.itemTemplate, {data: obj});
		console.log('template in base64 created from \"'+file.src[0]+'\"');
	};
	var pngToTemplate = function(file, data) {
		var baseName =  path.basename(file, data.generalObj.ext);
		var obj = {
			className: data.generalObj.prefix + baseName,
			mixinName: data.generalObj.mixinName,
			fileName: baseName
		};
		data.resultAllItems += grunt.template.process(data.template.itemTemplate, {data: obj}) + "\n";
	};

	grunt.registerMultiTask('svgzr', 'Convert svg to png, and create templates for sass and compass with base64 svg and png.', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		var done = this.async();

		var options = this.options({
			templateFile: 'template.json',
			files: {
				cwdSvg: 'svgMin/',
				cwdPng: "png/"
			},
			prefix: 'svg-',
			svg: false,
			fallback : false,
			png: false

		});
		if(options.png === true) {
			options.png = {};
		}
		if(options.png && options.png.type === undefined){
			options.png.type = "svg2png";
		}

		var templateFile;
		if(grunt.file.isFile(options.templateFile)) {
			templateFile = grunt.file.readJSON(options.templateFile);
		}
		else {
			templateFile = {
				"svg" : {
					"generalVarsTemplate": "",
					"itemVarsTemplate": "$<%= className %>-width: <%= width %>;\n$<%= className %>-height: <%= height %>;\n",
					"generalTemplate": "",
					"itemTemplate": ".<%= className %> {\n\tbackground-image: url('data:image/svg+xml;base64,<%= base64 %>');\n<%= size %>}\n\n",
					"allItemsTemplate": "<%= allClasses %> {\n\tbackground-repeat: no-repeat;\n}",
					"sizeTemplate": "\twidth: $<%= className %>-width;\n\theight: $<%= className %>-height;\n"
				},
				"fallback" : {
					"generalVarsTemplate": "",
					"itemVarsTemplate": "",
					"generalTemplate": "@import 'compass/utilities/sprites';\n@import '<%= dir %>*<%= ext %>';\n\n// Helper for svg fallbacks (ie8 and lower/unsupported browsers)\n@mixin <%= mixinName %>($fileName){\n\t.no-svg &, .ielt9 & {\n\t\t@include <%= lastDir %>-sprite($fileName);\n\t\twidth: <%= lastDir %>-sprite-width($fileName);\n\t\theight: <%= lastDir %>-sprite-height($fileName);\n\t}\n}\n",
					"itemTemplate": ".<%= className %> {\n\t@include <%= mixinName %>(<%= fileName %>);\n}\n",
					"allItemsTemplate": ""
				}
			};
		}

		if(options.fallback) {
			var fallbackData = {
				resultItemVars : "",
				resultGeneral : "",
				resultItem : "",
				resultAllItems : "",
				allClasses: "",
				template: templateFile.fallback,
				generalObj : {
					prefix: options.prefix,
//                    dir: path.relative(path.basename(options.fallback.destfile), options.files.cwdPng),
					dir: options.fallback.dir,
//                    lastDir: path.basename(options.files.cwdPng),
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
				fallbackData.resultGeneral = grunt.template.process(fallbackData.template.generalTemplate, {data: fallbackData.generalObj});
				grunt.file.write(options.fallback.destFile, fallbackData.resultGeneral + "\n\n" + fallbackData.resultAllItems);
			}


		}

		if(options.svg || options.png){
			var converter = null;
			var svgData = {
				resultItemVars : "",
				resultGeneral : "",
				resultItem : "",
				resultAllItems : "",
				allClasses: "",
				template: templateFile.svg
			};
			var filesSvg = grunt.file.expandMapping(['*.svg'], options.files.cwdPng, {
				cwd: options.files.cwdSvg,
				ext: '.png',
				extDot: 'first'
			});

			filesSvg.forEach(function(file, i) {
				// svg template
				if(options.svg) {
					svgToTemplate(file, options, svgData);
					svgData.allClasses += ((i===filesSvg.length-1) ? "" : ", ");
				}


				// svg to png
				if(options.png !== false && (options.png.type === 'gm' || options.png.type === 'im' || options.png.type === 'svg2png')) {
					if(options.png.type === 'gm' || options.png.type === 'im') {
						converter = gm;
						grunt.file.mkdir(options.files.cwdPng);
						if(options.png.type === 'im') {
							converter = converter.subClass({ imageMagick: true });
						}

					}
					else if(options.png.type === 'svg2png') {
						converter = svg2png;
					}
					svgToPng(file, {type: options.png.type, converter: converter});
				}

			}.bind(this));
			if(options.svg && filesSvg.length !== 0) {
				svgData.resultAllItems = grunt.template.process(svgData.template.allItemsTemplate, {data: {allClasses: svgData.allClasses}});
				grunt.file.write(options.svg.destFile, svgData.resultItemVars + "\n" + svgData.resultItem + svgData.resultAllItems + "\n\n");
			}
		}

//		done();
	});

};
