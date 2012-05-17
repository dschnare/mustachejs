/*global '$', 'module', 'test', 'strictEqual', 'MUSTACHE'*/
/*jslint evil: true */
// Synthesizes all tests from the .json test specification files
// for mustache into test suites.
function synthesizeTestSuites(testSuiteResources) {
	'use strict';

	var key,
		uri,
		root = new $.Deferred(),
		chained = root;

	function makeHandler(suiteName, uri) {
		return function () {
			return $.ajax({
				url: uri,
				dataType: 'text'
			}).pipe(function (text) {
				return (new Function('return ' + text)());
			}).pipe(function (o) {
				if (o.tests) {
					module(uri);

					test(suiteName, (function (tests) {
						return function () {
							var i, len = tests.length, testObj, rendered, testData;

							for (i = 0; i < len; i += 1) {
								testObj = tests[i];

								if (testObj.data.lambda) {
									testObj.data.lambda = (new Function('return ' + testObj.data.lambda.js)());
								}

								rendered = MUSTACHE.render(testObj.template, testObj.data, testObj.partials);
								strictEqual(rendered, testObj.expected, testObj.desc);
							}
						};
					}(o.tests)));
				}
			}).promise();
		};
	}

	for (key in testSuiteResources) {
		if (testSuiteResources[key] !== undefined) {
			uri = testSuiteResources[key];

			if (typeof uri === 'string') {
				chained = chained.pipe(makeHandler(key, uri));
			}
		}
	}

	root.resolve();

	return chained.promise();
}

// Create test suites from each mustache test specification file.
synthesizeTestSuites({
	'Comments': 'inc/data/comments.json',
	'Delimiters': 'inc/data/delimiters.json',
	'Interpolation': 'inc/data/interpolation.json',
	'Inverted': 'inc/data/inverted.json',
	'Partials': 'inc/data/partials.json',
	'Sections': 'inc/data/sections.json',
	'~Lambdas': 'inc/data/~lambdas.json'
});