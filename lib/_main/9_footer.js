		MUSTACHE = {
			"inspect": inspect,
			"makeContextStack": makeContextStack,
			"render": function (template, data, partials, delimiters, disableRecursion, contextStack) {
				var interpreter = makeInterpreter();
				return interpreter.interpret(template, data, partials, delimiters, disableRecursion, contextStack);
			}
		};

	xport.module(MUSTACHE, function () {
		xport('MUSTACHE', MUSTACHE);
	});
}(typeof XPORT === 'function' ? XPORT : null));