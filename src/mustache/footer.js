		MUSTACHE = {
			"render": function (template, data, partials) {
				var interpreter = makeInterpreter();
				return interpreter.interpret(template, data, partials);
			}
		};

	xport.module(MUSTACHE, function () {
		xport('MUSTACHE', MUSTACHE);
	});
}());