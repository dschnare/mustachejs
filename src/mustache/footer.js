		MUSTACHE = {
			"render": function (template, data, partials, delimiters) {
				var interpreter = makeInterpreter();
				return interpreter.interpret(template, data, partials, delimiters);
			}
		};

	xport.module(MUSTACHE, function () {
		xport('MUSTACHE', MUSTACHE);
	});
}());