function runTestSuites(moduleNames, testData) {
	'use strict';

	var key, moduleName;

	function runTests(moduleName, json) {
		var i, len, testObj, tests;

		if (json.tests) {
			module(moduleName);

			tests = json.tests;
			len = tests.length;

			for (i = 0; i < len; i += 1) {
				testObj = tests[i];

				(function (testObj) {
					test(testObj.name, function () {
						var rendered;

						if (testObj.data.lambda) {
							testObj.data.lambda = (new Function('return ' + testObj.data.lambda.js)());
						}

						rendered = MUSTACHE.render(testObj.template, testObj.data, testObj.partials);
						strictEqual(rendered, testObj.expected, testObj.desc);
					});
				}(testObj));
			}
		}
	}

	for (key in testData) {
		if (moduleNames[key] !== undefined) {
			moduleName = moduleNames[key];

			if (typeof moduleName === 'string') {
				runTests(moduleName, testData[key]);
			}
		}
	}
}

runTestSuites({
	'comments.json': 'Comments',
	'delimiters.json': 'Delimiters',
	'interpolation.json': 'Interpolation',
	'inverted.json': 'Inverted',
	'partials.json': 'Partials',
	'sections.json': 'Sections',
	'~lambdas.json': '~Lambdas'
}, TEST_DATA);