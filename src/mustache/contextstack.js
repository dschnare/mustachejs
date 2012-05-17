		// This represents a the context stack that keeps track of the current
		// context and any 'child' contexts.
		makeContextStack = function (o) {
			var stack = [{}],
				bind = function (fn, thisObj) {
					var f = function () {
							if (arguments.length) {
								return fn.apply(thisObj, arguments);
							}
							return fn.call(thisObj);
						};

					f.valueOf = fn.valueOf === f.valueOf ? f.valueOf : function () { return fn.valueOf(); };
					f.toString = fn.toString === f.toString ? f.toString : function () { return fn.toString(); };
					f.originalMethod = fn;
					f.thisObj = thisObj;

					return f;
				},
				ctxStack = {
					// Retrieves the current context (i.e. top of the stack).
					context: function () {
						return stack[stack.length - 1];
					},
					// A reference to the internal stack.
					stack: function () {
						return stack;
					},
					// Traverses the stack, starting from the top, looking
					// for an object with the specified key name. If no name exists
					// in any context then returns undefined. If the key is a method
					// then the function returned will be bound to the appropriate context
					// and can be called with the same arguments as the original method.
					// The function returned will also contain the property 'originalMethod'
					// that will reference the underlying method and the property 'thisObj'
					// that will reference the underlying context (i.e. this object). Also,
					// the function returned will preserve the toString() and valueOf() methods
					// of the original method being wrapped.
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
		},