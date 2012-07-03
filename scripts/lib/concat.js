var fs = require('fs'),
	path = require('path');

function concat(dir, filter, fn) {
	var text = '';

	if (typeof filter === 'function' &&
			typeof fn !== 'function') {
		fn = filter;
		filter = null;
	}

	fn = typeof fn === 'function' ? fn : function () {};
	filter = typeof filter === 'function' ? filter : function (filename, text) { return text; };

	fs.readdir(dir, function (error, files) {
		if (error) {
			fn(error);
		} else {
			files.sort();

			if (files.every(function (filename) {
				var file = path.join(dir, filename);

				try {
					if (fs.statSync(file).isFile()) {
						text += filter(filename, fs.readFileSync(file, 'utf8'));
					}
				} catch (error) {
					fn(error);
					return false;
				}

				return true;
			})) {
				fn(null, text);
			}
		}
	});
}

function concatThenSave(dir, filename, filter, fn) {
	if (typeof filter === 'function' &&
			typeof fn !== 'function') {
		fn = filter;
		filter = null;
	}

	fn = typeof fn === 'function' ? fn : function () {};

	concat(dir, filter, function (error, text) {
		if (error) {
			fn(error);
		} else {
			fs.writeFile(filename, text, 'utf8', function (error) {
				if (error) {
					fn(error);
				} else {
					fn(null, text);
				}
			});
		}
	});
}

exports = module.exports = {
	concat: concat,
	concatThenSave: concatThenSave
};