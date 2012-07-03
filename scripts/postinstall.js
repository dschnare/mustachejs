var fs = require('fs'),
	path = require('path'),
	concat = require('./lib/concat'),
	partialsDir = path.join(__dirname, '../lib/_main'),
	mainFile = path.join(__dirname, '../lib/main.js');

concat.concatThenSave(partialsDir, mainFile, function (error) {
	if (error) {
		console.error('Failed to concatenate files: ' + error);
	}
});