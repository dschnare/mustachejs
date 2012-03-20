(function () {
	'use strict';

	// This represents a the context stack that keeps track of the current
	// context and any 'child' contexts.

	return function (o) {
		var stack = [{}],
			ctxStack = {
				// Retrieves the current context (i.e. top of the stack).
				context: function () {
					return stack[stack.length - 1];
				},
				// Traverses the stack, starting from the top, looking
				// for an object with the specified key. If no key exists
				// in all contexts then returns undefined.
				get: function (key) {
					var i = stack.length;

					while (i) {
						i -= 1;

						if (stack[i][key] !== undefined) {
							return stack[i][key];
						}
					}

					return undefined;
				},
				// Pushes a new object onty the stack.
				// This object is now the current context.
				push: function (o) {
					stack.push(o);
					return o;
				},
				// Pops the current context off the stack.
				// The current context is now the last 'child'
				// context. Calling this method has no affect
				// when the stack size is 1.
				pop: function () {
					if (stack.length !== 1) {
						stack.pop();
					}

					return this.context();
				}
			};

		// If an object was passed to this function
		// then we try pussing it onto the stack.
		if (arguments.length === 1) {
			ctxStack.push(o);
		}

		return ctxStack;
	};
}());