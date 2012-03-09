(function () {
	'use strict';

	// The util object represents a set of utilitarian functions.

	return {
		// Determines if an object is an array.
		isArray: (function () {
			var toString = {}.constructor.prototype.toString;

			return function (o) {
				return toString.call(o) === '[object Array]';
			};
		}()),
		// Escape known problematic HTML characters in the specified string.
		// This function does not use regular expressions.
		htmlEscape: (function () {
			var ENTITY_MAP = {
				'<': '&lt;',
				'>': '&gt;',
				'&': '&amp;',
				'"': '&quot;',
				"'": '&apos;'
			};

			return function (str) {
				var i = str.length,
					c = null,
					entity = null;

				while (i) {
					i -= 1;
					c = str.charAt(i);
					entity = ENTITY_MAP[c];

					if (entity) {
						str = str.substring(0, i) + entity + str.substring(i + 1);
					}
				}

				return str;
			};
		}()),
		// Trim the leading and trailing whitespace characters
		// from the specified string. This function does not use
		// regular expressions.
		trim: function (str) {
			var i = 0,
				c = str.charAt(i);

			while (c) {
				if (c > ' ') {
					str = str.substring(i);
					break;
				}

				i += 1;
				c = str.charAt(i);
			}

			i = str.length;

			while (i) {
				i -= 1;
				c = str.charAt(i);

				if (c > ' ') {
					str = str.substring(0, i + 1);
					break;
				}
			}

			return str;
		},
		// Prepends each line in the specified string with the specified indent string.
		// If a line is length 0 then the line is not indented.
		indent: function (str, indent) {
			var i = str.length,
				c = null;

			while (i) {
				i -= 1;
				c = str.charAt(i);

				if ((c === '\n' || c === '\r') && (str.charAt(i + 1) !== '\n')) {
					if (str.charAt(i + 1)) {
						str = str.substring(0, i + 1) + indent + str.substring(i + 1);
					}
				}
			}

			return str ? indent + str : str;
		}
	};
}());