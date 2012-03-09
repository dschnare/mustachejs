// Entry point.
$(function () {
	/*
		Synthesizes all tests from the .json test specification files
		for mustache into test suites.
	*/
	function synthesizeTestSuites (testSuiteResources) {
		var key,
			uri,
			root = new $.Deferred(),
			chained = root;

		for (key in testSuiteResources) {
			uri = testSuiteResources[key];

			if (typeof uri === 'string') {
				chained = chained.pipe((function(suiteName, uri) {
					return function(suites) {
						return $.ajax({
							url: uri,
							dataType: 'text',
						}).pipe(function(text) {
							return (Function('return ' + text)());
						}).pipe(function(o) {
							var tests = o.tests,
								i = 0,
								len,
								test,
								suite = {};

							suites.push(suiteName, suite);

							if (tests) {
								len = tests.length;

								for (i = 0; i < len; i += 1) {
									test = tests[i];
									suite[test.name] = (function (desc, template, data, partials, expected) {
										if (data.lambda) {
											data.lambda = (Function('return ' + data.lambda.js)());
										}

										return function() {
											unit.expect(desc, MUSTACHE.render(template, data, partials) == expected);
										};
									}(test.desc, test.template, test.data, test.partials, test.expected));
								}
							}

							return suites;
						}).promise();
					};
				}(key, uri)));
			}
		}

		root.resolve([]);

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

	// When the test suites are done synthesizing (i.e. created)
	// then we simply create and run a test harness to run them all.
	}).done(function(suites) {
		var args = ['Mustache.js'];
		args.push.apply(args, suites);
		unit.makeTestHarness.apply(unit, args).run();
	});
});