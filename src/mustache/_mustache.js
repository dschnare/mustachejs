var MUSTACHE = (function () {
	'use strict';

	var k = null,
		util = {{util}},
		makeTokenizer = {{tokenizer}},
		makeMutableString = {{mutablestring}},
		makeContextStack = {{contextstack}},
		parsing = {{parsing}},
		MUSTACHE = {
			makeTokenizer: makeTokenizer,
			containsMarkup: parsing.containsMarkup,
			getReferencedProperties: parsing.getReferencedProperties,
			render: function (template, data, partials) {
				var parser = parsing.makeParser();

				return parser.parse({
					template: template,
					data: data,
					partials: partials
				});
			}
		};

	// Asynchronous modules (AMD) supported.
	if (typeof define === 'function' &&
		typeof define.amd === 'object') {

		define(MUSTACHE);
		MUSTACHE = undefined;

	// Nodejs/CommonJS modules supported.
	} else if (typeof exports !== 'undefined') {

		for (k in MUSTACHE) {
			exports[k] = MUSTACHE[k];
		}
		MUSTACHE = undefined;
	}

	return MUSTACHE;
}());