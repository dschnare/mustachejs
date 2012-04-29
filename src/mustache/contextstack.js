(function () {
	'use strict';

	// This represents a the context stack that keeps track of the current
	// context and any 'child' contexts.

	return function (o) {
		var stack = [{}],
			bind = function (fn, thisObj) {
				return function () {
					return fn.apply(thisObj, arguments);
				};
			},
			ctxStack = {
				// Retrieves the current context (i.e. top of the stack).
				context: function () {
					return stack[stack.length - 1];
				},
				// Traverses the stack, starting from the top, looking
				// for an object with the specified key name. If no name exists
				// in any context then returns undefined.
				get: function (name) {
					var i = stack.length, o, p, ret;

					while (i) {
						i -= 1;
						o = stack[i];
						p = o[name];

						if (p !== undefined) {
							if (typeof p === 'function') {
								ret = bind(p, o);
								break;
							} else {
								ret = p;
								break;
							}
						}
					}

					return ret;
				},
				// Traverses the stack, starting from the top, looking
				// for an object with the specified name. If no name exists
				// in any context then returns undefined. Otherwise
				// returns the context that has name.
				getContext: function (name) {
					var i = stack.length, o;

					while (i) {
						i -= 1;
						o = stack[i];

						if (o[name] !== undefined) {
							return o;
						}
					}
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