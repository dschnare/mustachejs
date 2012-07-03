		MUSTACHE = {
			"inspect": inspect,
			"render": function (template, data, partials, delimiters, disableRecursion) {
				var interpreter = makeInterpreter();
				return interpreter.interpret(template, data, partials, delimiters, disableRecursion);
			}
		};

	xport.module(MUSTACHE, function () {
		xport('MUSTACHE', MUSTACHE);
	});
}(typeof XPORT === 'function' ? XPORT : null));