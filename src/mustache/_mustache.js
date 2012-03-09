var MUSTACHE = (function () {
	'use strict';

	var util = {{util}},
		makeTokenizer = {{tokenizer}},
		makeMutableString = {{mutablestring}},
		makeContextStack = {{contextstack}},
		makerParser = {{parser}};

	return {
		render: function (template, data, partials) {
			var parser = makerParser();

			return parser.parse({
				template: template,
				data: data,
				partials: partials
			});
		}
	};
}());