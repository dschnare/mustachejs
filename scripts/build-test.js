var fs = require('fs'),
	path = require('path'),
	concat = require('./lib/concat'),
	$4web = require('4web'),
	partialsDir = path.join(__dirname, '../test/js/_data'),
	dataFile = path.join(__dirname, '../test/js/data.js');

concat.concat(partialsDir, function (filename, text) {
	return ', "' + filename + '": ' + text;
}, function (error, text) {
	if (error) {
		console.error('Failed to concatenate files: ' + error);
	} else {
		text = 'var TEST_DATA = {' + text.substring(2) + '};';
		fs.writeFile(dataFile, text, 'utf8', function (error) {
			if (error) {
				fn(error);
			} else {
				$4web.build('test/js')
				.done(function (error) {
					if (error) {
						console.error(error.toString());
					}
				});
			}
		});
	}
});