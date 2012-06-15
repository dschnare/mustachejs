/**
 * @preserve Module: xport
 * Author: Darren Schnare
 * Keywords: javascript,export
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/dschnare/project-template
 */

/*globals 'window', 'define', 'exports', 'require' */

(function () {
	'use strict';

	/**
	 * Exports a symbol with the given name onto the specified scope.
	 *
	 * @param {String} name The name to give the symbol for export.
	 * @param {Object} symbol The symbol to export.
	 * @param {Object} scope The scope to export into. Defaults to the window object if it exists, otherwise an empty object.
	 * @return {Object} The scope exported to.
	 */
	function xport(name, symbol, scope) {
		name = name ? name.toString() : '';

		if (!scope) {
			if (typeof window !== 'object') {
				scope = {};
			} else {
				scope = window;
			}
		}

		var names = name.split('.'),
			len = names.length,
			o = scope,
			i,
			n;

		for (i = 0; i < len - 1; i += 1) {
			n = names[i];

			if (o[n] === undefined) {
				o[n] = {};
			}

			o = o[n];
		}

		n = names[len - 1];
		o[n] = symbol;

		return scope;
	}

	/**
	 * Attempts to export a module using either the AMD or CommonJS module system. If no module system
	 * is present then will call the fallback callback.
	 *
	 * For example:
	 *	// With dependencies
	 *	xport.module(['dep1', 'jquery', 'dep2'], moduleFn, function () {
	 *		xport('MODULE', moduleFn(DEP1, jQuery, DEP2));
	 *	});
	 *
	 *	// Without dependencies
	 *	xport.module(moduleFn, function () {
	 *		xport('MODULE', moduleFn());
	 *	});
	 *
	 *	// Without dependencies
	 *	xport.module(someObject, function () {
	 *		xport('MODULE', someObject);
	 *	});
	 *
	 * @param {Array<String>=} deps The module dependencies to use when exporting via AMD or CommonJS (optional).
	 * @param {function(...Object):Object|Object} fn The module function or if an object if there are no dependencies.
	 * @param {function()} fallback The callback to call when no module system exists.
	 */
	function module(deps, fn, fallback) {
		var d, i, o, k, Object = ({}).constructor;

		if (Object.prototype.toString.call(deps) !== '[object Array]') {
			fallback = fn;
			fn = deps;
			deps = [];

			// If 'fn' is not a function then wrap it in a function.
			if (typeof fn !== 'function') {
				fn = (function (o) {
					return function () {
						return o;
					};
				}(fn));
			}
		}

		// Asynchronous modules (AMD) supported.
		if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
			if (deps.length === 0) {
				define(fn);
			} else {
				define(deps, fn);
			}
		// Nodejs/CommonJS modules supported.
		} else if (typeof exports === 'object' && exports && typeof require === 'function') {
			if (deps.length === 0) {
				o = fn();
			} else {
				d = [];
				i = deps.length;

				// Require all dependencies.
				while (i > 0) {
					i -= 1;
					d.unshift(require(deps[i]));
				}

				// Build the module.
				o = fn.apply(undefined, d);
			}

			// Export the module.
			if (o) {
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						exports[k] = o[k];
					}
				}
			}
		// There is no module system present so call the fallback.
		} else if (typeof fallback === 'function') {
			fallback();
		}
	}

	// Export the module function on the xport funciton.
	xport('module', module, xport);
	// Export the xport function to the window (if it exists).
	xport('xport', xport);
}());
/**
 * @preserve Author: Darren Schnare
 * Keywords: javascript,mustache,template
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/dschnare/mustachejs
 */
/*jslint 'continue': true*/
/*global 'xport'*/
(function () {
	'use strict';

	// The util object represents a set of utilitarian functions.
	var util = {
			// Determines if an object is an array.
			isArray: (function () {
				var toString = {}.constructor.prototype.toString;

				return function (o) {
					return toString.call(o) === '[object Array]';
				};
			}()),
			// Escape known problematic HTML characters in the specified string.
			// This function does not use regular expressions.
			htmlEscape: (function () {
				var ENTITY_MAP = {
					'<': '&lt;',
					'>': '&gt;',
					'&': '&amp;',
					'"': '&quot;',
					"'": '&apos;'
				};

				return function (str) {
					var i = str.length,
						c = null,
						entity = null;

					while (i) {
						i -= 1;
						c = str.charAt(i);
						entity = ENTITY_MAP[c];

						if (entity) {
							str = str.substring(0, i) + entity + str.substring(i + 1);
						}
					}

					return str;
				};
			}()),
			// Trim the leading and trailing whitespace characters
			// from the specified string. This function does not use
			// regular expressions.
			trim: function (str) {
				var i = 0,
					c = str.charAt(i);

				while (c) {
					if (c > ' ') {
						str = str.substring(i);
						break;
					}

					i += 1;
					c = str.charAt(i);
				}

				i = str.length;

				while (i) {
					i -= 1;
					c = str.charAt(i);

					if (c > ' ') {
						str = str.substring(0, i + 1);
						break;
					}
				}

				return str;
			},
			// Prepends each line in the specified string with the specified indent string.
			// If a line is length 0 then the line is not indented.
			indent: function (str, indent) {
				var i = str.length,
					c = null;

				while (i) {
					i -= 1;
					c = str.charAt(i);

					if ((c === '\n' || c === '\r') && (str.charAt(i + 1) !== '\n')) {
						if (str.charAt(i + 1)) {
							str = str.substring(0, i + 1) + indent + str.substring(i + 1);
						}
					}
				}

				return str ? indent + str : str;
			}
		},
		// This represents a tokenizer for mustache markup.
		// The tokenizer does not use regular expressions, instead
		// it iterates over each character.
		makeTokenizer = (function () {
				// A hash whose keys are characters that identify
				// a mustache token. The hash values are the token
				// types themselves.
			var tokenTypes = {
					'!': 'comment',
					'=': 'set-delimiter',
					// Since there is no character that identifies
					// interpolation, we use the empty character.
					'': 'interpolation',
					'&': 'unescape-interpolation',
					// Alternate syntax for unescaped interpolation.
					// Useful if templates are mixed with XML/HTML.
					'~': 'unescape-interpolation',
					// Use the '{' character to identify unescaped
					// interpolation (i.e. tripple mustache).
					'{': 'unescape-interpolation',
					'#': 'section-begin',
					'^': 'invert-section-begin',
					'/': 'section-end',
					'>': 'partial',
					// Alternate syntax for partials.
					// Useful if templates are mixed with XML/HTML.
					'@': 'partial',
					'.': 'implicit'
					// We also create 'text' tokens (i.e. anything other than mustache tokens).
				},
				// Makes a tokenizer that will tokenize the specified mustache template.
				// The tokenizer will only tokenize on an as-needed basis by calling next().
				// The next() method will return null if there are no more tokens available.
				makeTokenizer = function (template) {
					var pointer = typeof template.pointer === 'function' ? function (index) { return template.pointer(index); } : function (index) {
							return {
								value: index,
								toString: function () {
									return this.value.toString();
								},
								valueOf: function () {
									return this.value;
								}
							};
						},
						i = pointer(-1),
						c = null,
						line = 1,
						next = function (step) {
							if (step !== 0) {
								i.value += (step || 1);
								c = template.charAt(+i);
							}

							return c;
						},
						lookahead = function (count) {
							return template.substr(+i, count);
						};

					return {
						// Get/set the current position the tokenizer is at in the template.
						position: function (index) {
							index = +index;

							if (isFinite(index)) {
								i.value = index;
							}

							return +i;
						},
						// Retrieves all the tokens in the template starting from the begining of the template.
						// Note that only a single delimiter will be used.
						getTokens: function (delim) {
							var savedPosition = i.value,
								savedLine = line,
								token,
								tokens = [];

							line = 1;
							i.value = 0;
							token = this.next(delim);

							while (token) {
								tokens.push(token);
								token = this.next(delim);
							}

							line = savedLine;
							i.value = savedPosition;

							return tokens;
						},
						// Retrieve the next mustache token using the specified delimiters.
						// The delim argument must be an object of the form: {left:'{{', right:'}}'}
						next: function (delim) {
							if (!delim) {
								delim = makeTokenizer.defaultDelimiter();
							}

							// Create our variables and cache parts of the delimiter.
							var value = '',
								modifier = '',
								start = -1,
								tokenType = null,
								token = null,
								delimleft = delim.left,
								delimleftlen = delimleft.length,
								delimright = delim.right,
								delimrightlen = delimright.length,
								reset = function () {
									start = -1;
									modifier = '';
									value = '';
									tokenType = '';
								};

							// When reading a token we read past the end of the token.
							// This is done so that 'i' is updated if the token is removed.
							// However, since we're already pointing to the next character
							// we backup by 1 and then call next (only if 'i' is greater than 0)
							// (i.e. next() has been called after finding a token).
							if (i > 0) {
								i.value -= 1;
							}

							// Iterate over the string.
							while (next()) {
								if (c === '\n') {
									if (template.charAt(i - 1) !== '\r') {
										line += 1;
									}
								} else if (c === '\r') {
									line += 1;
								}

								// Look for the left delimiter (i.e. '{{').
								if (lookahead(delimleftlen) === delimleft) {
									start = +i;
									next(delimleftlen);

									// Look for a modifier.
									switch (c) {
									// Custom delimiter.
									case '=':
									// Comment.
									case '!':
									// Unescaped interpolation.
									case '&':
									case '~':
									case '{':
									// Section.
									case '#':
									// Inverted section.
									case '^':
									// Section close.
									case '/':
									// Partial.
									case '>':
									case '@':
										modifier = c;
										break;
									// Implicit.
									case '.':
										modifier = value = c;
										break;
									// Interpolation.
									default:
										value += c;
									}

									// Read the value of the token.
									while (next()) {
										// Handle 'tripple mustache' specifically (i.e. read the first '}' and do nothing).
										if (!(modifier === '{' && delimright === '}}' && lookahead(3) === '}}}')) {
											// Found right delimiter (i.e. '}}').
											if (lookahead(delimrightlen) === delimright) {
												next(delimrightlen);
												break;
											} else {
												value += c;
											}
										}
									}

									// If the custom delimiter modifier was encountered,
									// then we remove the trailing '=' character.
									if (modifier === '=') {
										value = value.substring(0, value.length - 1);
									}

									// Implicit tokens must have nothing but the modifier '.' with no value.
									if (modifier === '.' && value !== modifier) {
										reset();
										continue;
									}

									tokenType = tokenTypes[modifier];

									// Unknown token type.
									if (!tokenType) {
										reset();
										continue;
									}

									// Create and return the token.
									token = {
										type: tokenType,
										value: util.trim(value),
										text: template.substring(start, +i),
										start: pointer(start),
										end: pointer(+i),
										line: line
									};

									break;
								// No delimiter found so we read characters
								// until we find a delimiter and return a text token.
								} else {
									start = +i;

									while (c && lookahead(delimleftlen) !== delimleft) {
										next();
									}

									token = {
										type: 'text',
										value: template.substring(start, i),
										text: template.substring(start, i),
										start: pointer(start),
										end: pointer(+i),
										line: line
									};

									if (token.text) {
										break;
									} else {
										token = null;
									}
								}
							}

							return token;
						}
					};
				};

			// The makeTokenizer() function exposes the
			// default mustache delimiter object.
			makeTokenizer.defaultDelimiter = function () {
				return {
					left: '{{',
					right: '}}'
				};
			};

			return makeTokenizer;
		}()),
		// This represents a mutable string. The mutable string
		// has several string-like operators, but has the ability
		// to be modified via the replace() method.
		//
		// The mutable string also maintains a list of pointers which
		// are simply indices into the string. These pointers are updated
		// to maintain their relative positions when the string is modified.
		//
		// A note about pointers: Pointers have a single property 'value' that
		// is the value or index of the pointer. All pointers can be treated
		// as integer-like since pointers override the valueOf() method.
		// The following operators can be used directly on a poitner: <,>,<=,>=,+,(unary)+,-,(unary)-,*,/
		makeMutableString = function (str) {
			str += '';
			var pointers = [],
				makePointer = function (index) {
					return {
						value: +index,
						toString: function () {
							return this.value.toString();
						},
						valueOf: function () {
							return this.value;
						}
					};
				};

			// Update all pointer to maintain their relative positions.
			// Only pointers that occur after the specified region will
			// be modified.
			//
			// Offset is the number of characters removed or added
			// in-place of the specified region.
			pointers.update = function (begin, end, offset) {
				var i = this.length,
					len = end - begin,
					pointer = null,
					after = function (index) {
						return index >= end;
					};

				offset -= len;

				while (i) {
					i -= 1;
					pointer = this[i];

					if (after(pointer)) {
						pointer.value += offset;
					}
				}
			};

			return {
				// The length of the string.
				length: str.length,
				// Retrieves the character at the specified position.
				// The 'index' argument can be an integer or pointer.
				charAt: function (index) {
					return str.charAt(+index);
				},
				// Retrieves the substring described by the specified range.
				// The 'begin' argument can be an integer or pointer.
				substr: function (begin, length) {
					return str.substr(+begin, length);
				},
				// Retrieves the substring described by the specified range.
				// The 'begin' argument can be an integer or pointer.
				substring: function (begin, end) {
					return str.substring(+begin, +end);
				},
				// Replaces the specified substring with the specified replacement.
				//
				// substr: the substring to replace
				// repl: the replacement string (will be coherced to string)
				//
				//
				// Replaces the specified range of characters with the specified replacement.
				//
				// begin: index of substring to replace
				// end: last index + 1 of the substring to replace
				// repl: the replacement string (will be coherced to string)
				//
				//
				// If pointers exist then all pointers that occur after the region
				// being replaced will be modified so that their relative
				// position will be maintained. All other pointers will remain unmodified.
				replace: function (args) {
					var begin = args.substr ? str.indexOf(args.substr) : +args.begin,
						end = args.substr ? begin + args.substr.length : +args.end,
						repl = args.repl === undefined ? '' : args.repl.toString();

					str = str.substring(0, begin) + repl + str.substring(end);
					pointers.update(begin, end, repl.length);
					this.length = str.length;
				},
				// Creates a pointer into the string at the specified index.
				// The 'index' argument can be an integer or pointer.
				pointer: function (index) {
					var pointer = makePointer(index);
					pointers.push(pointer);
					return pointer;
				},
				// Removes all pointers from this string.
				// All pointers are unmodified.
				clearPointers: function () {
					while (pointers.length) {
						pointers.pop();
					}
				},
				// Modifies all pointers to be set
				// to -1 and removes them from this string.
				invalidatePointers: function () {
					while (pointers.length) {
						pointers.pop().value = -1;
					}
				},
				// Finds the index of the specified substring
				// at the specified begin index.
				// The 'begin' argument can be an integer or pointer.
				indexOf: function (substr, begin) {
					var pointer = makePointer(str.indexOf(substr, +begin));

					if (pointer >= 0) {
						pointers.push(pointer);
					}

					return pointer;
				},
				// Finds the last index of the specified substring
				// at the specified begin index.
				// The 'begin' argument can be an integer or pointer.
				lastIndexOf: function (substr, begin) {
					var pointer = makePointer(str.lastIndexOf(substr, +begin));

					if (pointer >= 0) {
						pointers.push(pointer);
					}

					return pointer;
				},
				// The string representation of this string.
				toString: function () {
					return str;
				},
				// The native representation of this string.
				valueOf: function () {
					return str;
				}
			};
		},
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
		// This represents a mustache parser that is responsible
		// for simplifying walking the tokens in a mustache template.
		makeParser = function (template) {
			var tokenizer = makeTokenizer(template),
				// Variable to keep track of what section is currently
				// open and permits the closing of sections.
				openSection = (function () {
					var sections = [];

					return {
						isOpen: function () {
							return sections.length !== 0;
						},
						open: function (token) {
							sections.push(token);
						},
						close: function (endToken) {
							var beginToken = sections[sections.length - 1];

							if (this.isOpen() && beginToken.value === endToken.value) {
								beginToken.endToken = endToken;
								sections.pop();
							} else {
								throw new Error('Missing section-begin for : "' + endToken.text + '" on line ' + endToken.line);
							}
						},
						current: function () {
							return sections[sections.length - 1];
						}
					};
				}());

			return {
				hasOpenSection: function () {
					return openSection.isOpen();
				},
				getOpenedSectionToken: function () {
					return openSection.current();
				},
				next: function (delim) {
					var token = tokenizer.next(delim),
						temp,
						left,
						right,
						endToken;

					if (token) {
						switch (token.type) {
						// Parse the set-delimiter token by creating
						// a 'left' and 'right' property on the token
						// equal to the left and right delimiter respectively.
						case 'set-delimiter':
							if (token.value && token.value.indexOf('=') < 0) {
								temp = token.value.split(' ');
								left = temp[0];
								right = temp[1];

								if (left.indexOf(' ') >= 0 || right.indexOf(' ') >= 0) {
									throw new Error('Unexpected whitespace in set-delimiter token : "' + token.text + '" on line ' + token.line);
								}

								token.left = left;
								token.right = right;
							} else {
								throw new Error('Invalid set-delimiter token : "' + token.text + '" on line ' + token.line);
							}
							break;
						// Parse *-section-begin tokens by creating a
						// 'endToken' property on the token equal to
						// the section-end token for this section.
						case 'section-begin':
						case 'invert-section-begin':
							openSection.open(token);
							endToken = tokenizer.next(delim);

							// Scan ahead and get the closing section token.
							// We throw an error if section tokens are unballenced.
							while (endToken) {
								switch (endToken.type) {
								case 'section-begin':
								case 'invert-section-begin':
									openSection.open(endToken);
									break;
								case 'section-end':
									openSection.close(endToken);
									break;
								}

								if (token.endToken) {
									break;
								}

								endToken = tokenizer.next(delim);
							}
							break;
						// If we encounter a section-end token at this level this will result in an error.
						case 'section-end':
							openSection.close(token);
							break;
						}
					}

					return token;
				}
			};
		},
		// This represents a mustache interpreter responsible for
		// interpreting mustache templates into strings.
		// This interpreter will throw an error if any syntax errors
		// are detected (i.e. unballanced section tokens, invalid
		// set-delimiter token, etc.) and will interpret the tokens
		// according to the official mustache specification.
		makeInterpreter = (function () {
			var internalInterpreter,
				nativeValueOf = ({}).valueOf,
				resolvers = {
					// {name, contextStack, partials}
					interpolation: function (args) {
						var name = args.name,
							contextStack = args.contextStack,
							partials = args.partials,
							names = name.split('.'),
							i = 0,
							data,
							len = names.length,
							ctxStack = contextStack;

						for (i = 0; i < len - 1; i += 1) {
							name = names[i];
							data = ctxStack.get(name);

							// Resolution failed.
							if (data === undefined) {
								data = '';
								// Stop the loop.
								i = len;
							} else {
								// If the data has its own valueOf() implementation then
								// we respect it and convert the data using its valueOf() method.
								if (data && typeof data.valueOf === 'function' && data.valueOf !== nativeValueOf) {
									data = data.valueOf();
								} else if (typeof data === 'function') {
									data = data();
								}

								ctxStack = makeContextStack(data);
							}
						}

						// Lambdas:
						// When used as the data value for an Interpolation tag, the lambda MUST be
						// treatable as an arity 0 function, and invoked as such.  The returned value
						// MUST be rendered against the default delimiters, then interpolated in place
						// of the lambda.
						name = names[len - 1];
						data = ctxStack.get(name);

						// Resolution failed.
						if (data === undefined) {
							data = '';
						} else {
							// If the data has its own valueOf() implementation then
							// we respect it and convert the data using its valueOf() method.
							if (data && typeof data.valueOf === 'function' && data.valueOf !== nativeValueOf) {
								data = data.valueOf();
							} else if (typeof data === 'function') {
								data = data();
							}
						}

						return data;
					},
					// {name, sectionText, contextStack, delim, partials, [result]}
					// If result is an object then the property 'isLamba' will be set to
					// true if the section refers to a lambda.
					section: function (args) {
						var name = args.name,
							sectionText = args.sectionText,
							contextStack = args.contextStack,
							delim = args.delim,
							partials = args.partials,
							ctx = contextStack.context(),
							names = name.split('.'),
							i = 0,
							data,
							len = names.length,
							ctxStack = contextStack,
							render = function (template, newData) {
								return internalInterpreter.interpret({
									template: template,
									data: newData || ctx,
									delim: delim,
									partials: partials,
									contextStack: contextStack
								});
							};

						sectionText = sectionText.toString();

						for (i = 0; i < len - 1; i += 1) {
							name = names[i];
							data = ctxStack.get(name);

							// Resolution failed.
							if (data === undefined) {
								data = '';
								// Stop the loop.
								i = len;
							} else {
								// If the data has its own valueOf() implementation then
								// we respect it and convert the data using its valueOf() method.
								if (data && typeof data.valueOf === 'function' && data.valueOf !== nativeValueOf) {
									data = data.valueOf();
								} else if (typeof data === 'function') {
									if (data.originalMethod.length >= 1) {
										data = data(sectionText, render);
									} else {
										data = data();
									}
								}

								ctxStack = makeContextStack(data);
							}
						}

						// Lambdas:
						// When used as the data value for a Section tag, the lambda MUST be treatable
						// as an arity 1 function, and invoked as such (passing a String containing the
						// unprocessed section contents).  The returned value MUST be rendered against
						// the current delimiters, then interpolated in place of the section.
						name = names[len - 1];
						data = ctxStack.get(name);

						// Resolution failed.
						if (data === undefined) {
							data = '';
						} else {
							// If the data has its own valueOf() implementation then
							// we respect it and convert the data using its valueOf() method.
							if (data && typeof data.valueOf === 'function' && data.valueOf !== nativeValueOf) {
								data = data.valueOf();
							} else if (typeof data === 'function') {
								if (args.result) {
									args.result.isLambda = true;
								}

								data = data(sectionText, render);
							}
						}

						return data;
					},
					// {name, sectionText, contextStack, delim, partials}
					inverseSection: function (args) {
						var name = args.name,
							sectionText = args.sectionText,
							contextStack = args.contextStack,
							delim = args.delim,
							partials = args.partials,
							ctx = contextStack.context(),
							names = name.split('.'),
							i = 0,
							data,
							len = names.length,
							ctxStack = contextStack,
							render = function (template, newData) {
								return internalInterpreter.interpret({
									template: template,
									data: newData || ctx,
									delim: delim,
									partials: partials,
									contextStack: contextStack
								});
							};

						sectionText = sectionText.toString();

						for (i = 0; i < len - 1; i += 1) {
							name = names[i];
							data = ctxStack.get(name);

							// Resolution failed.
							if (data === undefined) {
								data = '';
								// Stop the loop.
								i = len;
							} else {
								// If the data has its own valueOf() implementation then
								// we respect it and convert the data using its valueOf() method.
								if (data && typeof data.valueOf === 'function' && data.valueOf !== nativeValueOf) {
									data = data.valueOf();
								} else if (typeof data === 'function') {
									if (data.originalMethod.length >= 1) {
										data = data(sectionText, render);
									} else {
										data = data();
									}
								}

								ctxStack = makeContextStack(data);
							}
						}

						// Lambdas:
						// When used as the data value for a Section tag, the lambda MUST be treatable
						// as an arity 1 function, and invoked as such (passing a String containing the
						// unprocessed section contents).  The returned value MUST be rendered against
						// the current delimiters, then interpolated in place of the section.
						name = names[len - 1];
						data = ctxStack.get(name);

						// Resolution failed.
						if (data === undefined) {
							data = '';
						} else {
							if (typeof data === 'function') {
								data = true;
							}
						}

						return data;
					},
					// {name, partials}
					partial: function (args) {
						var name = args.name,
							partials = args.partials,
							names = name.split('.'),
							len = names.length,
							i = 0,
							o = partials,
							partial;

						for (i = 0; i < len; i += 1) {
							name = names[i];
							partial = o[name];

							// Resolution failed.
							if (partial === undefined) {
								partial = '';
								// Stop the loop.
								i = len;
							} else {
								// If the partial has its own valueOf() implementation then
								// we respect it and convert the partial using its valueOf() method.
								if (partial && typeof partial.valueOf === 'function' && partial.valueOf !== nativeValueOf) {
									partial = partial.valueOf();
								} else if (typeof partial === 'function') {
									partial = partial();
								}

								o = partial;
							}
						}

						return partial;
					}
				},
				helpers = {
					// A standalone token is any token that appears on its own line.
					// Standalone tokens are to be trimmed such that all leading whitespace
					// upto but not including the first newline are trimmed and all trailing
					// whitespace upto and including the first newline are trimmed.
					trimStandaloneToken: function (template, token) {
						// Leading whitespace.
						var i = token.start - 1,
							c = template.charAt(i),
							// Start by assuming the token is truly standalone.
							standalone = true,
							k = 0,
							leading = '';

						// Iterate backward toward index 0, looking for a newline.
						// If a newline is found then we exit the loop. If a
						// non-whitespace character is found then we exit the loop
						// and mark the token as non-standalone.
						while (c) {
							if (c > ' ') {
								standalone = false;
								break;
							} else if (c === '\n' || c === '\r') {
								break;
							}

							i -= 1;
							c = template.charAt(i);
						}

						k = i + 1;

						// If the token is standalone.
						if (standalone) {
							// Trailing whitespace.
							// It's important that we make i a pointer.
							i = template.pointer(token.end);
							c = template.charAt(i);

							// Iterate forward toward the end of the token, looking for a newline.
							// If a newline is found then we exit the loop, but make sure to
							// consume the newline when we trim (handle \r\n intelligently). If a
							// non-whitespace character is found then we exit the loop
							// and mark the token as non-standalone.
							while (c) {
								if (c > ' ') {
									standalone = false;
									break;
								} else if (c === '\n' || c === '\r') {
									if (c === '\r' && template.charAt(i + 1) === '\n') {
										i.value += 1;
									}
									break;
								}

								i.value += 1;
								c = template.charAt(i);
							}

							// If the token is 'still' standalone
							// then the token is truly standalone.
							if (standalone) {
								// Save the leading whitespace so that it can be returned.
								leading = template.substring(k, token.start);

								// Remove the leading whitespace.
								template.replace({
									begin: k,
									end: token.start
								});

								// Remove the trailing whitespace.
								// Note that i is a pointer so it is
								// automatically updated after we remove
								// the leading whitespace.
								template.replace({
									begin: token.end,
									end: i + 1
								});
							}
						}

						// Return the leading whitespace (used for indenting partials).
						return leading;
					},
					// Helper function to replace a token in the mustache template.
					replaceToken: function (template, token, repl) {
						template.replace({begin: token.start.value, end: token.end.value, repl: repl || ''});
					},
					// Helper function to replace a token that can appear as standalone, in the mustache template.
					replaceStandaloneToken: function (template, token, repl) {
						helpers.trimStandaloneToken(template, token);
						template.replace({begin: token.start.value, end: token.end.value, repl: repl || ''});
					},
					// Renders a mustache section.
					// The 'args' argument is an object with the following properties:
					//
					// template - the template string
					// data - the data or context to use for expansion
					// contextStack - the context stack
					// partials - a hash containing partial templates to be used in partial expansion
					// delim - the left and right delimiters as: {left, right}
					renderSection: function (args) {
						var template = args.template,
							data = args.data,
							delim = args.delim,
							contextStack = args.contextStack,
							partials = args.partials,
							i = 0,
							len = 0,
							str = '',
							temp = null,
							d,
							extraPush = false;

						if (!util.isArray(data)) {
							if (data) {
								data = [data];
							} else {
								data = [];
							}
						}

						len = data.length;

						for (i = 0; i < len; i += 1) {
							d = data[i];
							extraPush = false;
							contextStack.push(d);

							// If the data has its own valueOf() implementation then
							// we respect it and convert the data using its valueOf() method.
							if (d && typeof d.valueOf === 'function' && d.valueOf !== nativeValueOf) {
								extraPush = true;
								d = d.valueOf();
								contextStack.push(d);
							}

							// If the data is a function then we call it and use its result
							// as the data for the template.
							if (typeof d === 'function') {
								extraPush = true;
								d = d();
								contextStack.push(d);
							}

							temp = internalInterpreter.interpret({
								// Prefix and postfix the template artificially
								// so that the first and last tokens do
								// not get treated as standalone.
								template: '=' + template + '=',
								data: d,
								contextStack: contextStack,
								partials: partials,
								delim: delim
							});

							str += temp.substring(1, temp.length - 1);
							contextStack.pop();

							// If we used the data's valueOf() method or the data was a function
							// then we have an extra object on the context stack so we need to pop it.
							if (extraPush) {
								contextStack.pop();
							}
						}

						return str;
					}
				},
				interpreters = {
					// {template, token, data, contextStack, partials}
					implicit: function (args) {
						var template = args.template,
							token = args.token,
							data = args.data,
							contextStack = args.contextStack,
							partials = args.partials,
							disableRecursion = args.disableRecursion;

						if (!disableRecursion) {
							data = internalInterpreter.interpret({
								template: typeof data === 'function' ? data() : data,
								data: contextStack.context(),
								contextStack: contextStack,
								partials: partials
							});
						} else if (typeof data === 'function') {
							data = data();
						}

						helpers.replaceToken(template, token, data);
					},
					// {template, token, delim}
					setDelimiter: function (args) {
						var template = args.template,
							token = args.token,
							delim = args.delim;

						delim.left = token.left;
						delim.right = token.right;

						helpers.replaceStandaloneToken(template, token);
					},
					// {template, token, contextStack, partials}
					interpolation: function (args) {
						var template = args.template,
							token = args.token,
							contextStack = args.contextStack,
							partials = args.partials,
							disableRecursion = args.disableRecursion,
							temp = resolvers.interpolation({
								name: token.value,
								contextStack: contextStack,
								partials: partials
							});

						if (!disableRecursion) {
							temp = internalInterpreter.interpret({
								template: temp,
								data: contextStack.context(),
								contextStack: contextStack,
								partials: partials
							});
						}

						if (temp) {
							temp = util.htmlEscape(temp.toString());
							helpers.replaceToken(template, token, temp);
						} else {
							helpers.replaceToken(template, token);
						}
					},
					// {template, token, contextStack, partials}
					unescapedInterpolation: function (args) {
						var template = args.template,
							token = args.token,
							contextStack = args.contextStack,
							partials = args.partials,
							disableRecursion = args.disableRecursion,
							temp = resolvers.interpolation({
								name: token.value,
								contextStack: contextStack,
								partials: partials
							});

						if (!disableRecursion) {
							temp = internalInterpreter.interpret({
								template: temp,
								data: contextStack.context(),
								contextStack: contextStack,
								partials: partials
							});
						}

						if (temp) {
							temp += '';
							helpers.replaceToken(template, token, temp);
						} else {
							helpers.replaceToken(template, token);
						}
					},
					// {template, token, contextStack, data, partials}
					partial: function (args) {
						var template = args.template,
							token = args.token,
							data = args.data,
							contextStack = args.contextStack,
							partials = args.partials,
							temp = '',
							leading = helpers.trimStandaloneToken(template, token),
							partial = resolvers.partial({
								name: token.value,
								partials: partials
							});

						if (partial) {
							partial = partial.toString();
							// If there is whitespace leading the token then
							// we use this leading as the indentation for the
							// partial template. It's key to indent the partial
							// template BEFORE it is parsed.
							if (leading) {
								partial = util.indent(partial, leading);
							}

							// Now parse the partial template.
							temp = internalInterpreter.interpret({
								template: partial,
								data: data,
								contextStack: contextStack,
								partials: partials
							});
						}

						helpers.replaceToken(template, token, temp);
					},
					// {template, token, contextStack, partials, delim}
					section: function (args) {
						var template = args.template,
							beginToken = args.token,
							contextStack = args.contextStack,
							partials = args.partials,
							delim = args.delim,
							endToken = beginToken.endToken,
							innerText = null,
							data = null,
							resolveResult = {};

						helpers.trimStandaloneToken(template, endToken);
						helpers.trimStandaloneToken(template, beginToken);

						innerText = template.substring(beginToken.start + beginToken.text.length, endToken.end - endToken.text.length);
						data = resolvers.section({
							name: beginToken.value,
							sectionText: innerText,
							contextStack: contextStack,
							delim: delim,
							partials: partials,
							result: resolveResult
						});

						if (resolveResult.isLambda && typeof data === 'string') {
							data = internalInterpreter.interpret({
								template: data,
								data: contextStack.context(),
								contextStack: contextStack,
								delim: delim,
								partials: partials
							});

							template.replace({
								begin: beginToken.start,
								end: endToken.end,
								repl: data
							});
						} else if (!data || (util.isArray(data) && !data.length)) {
							template.replace({
								begin: beginToken.start,
								end: endToken.end
							});
						} else {
							template.replace({
								begin: beginToken.start,
								end: endToken.end,
								repl: helpers.renderSection({
									template: innerText,
									data: data,
									contextStack: contextStack,
									partials: partials,
									delim: delim
								})
							});
						}
					},
					// {template, token, contextStack, partials, delim}
					inverseSection: function (args) {
						var template = args.template,
							beginToken = args.token,
							contextStack = args.contextStack,
							partials = args.partials,
							delim = args.delim,
							endToken = beginToken.endToken,
							innerText = null,
							data = null;

						helpers.trimStandaloneToken(template, endToken);
						helpers.trimStandaloneToken(template, beginToken);

						innerText = template.substring(beginToken.start + beginToken.text.length, endToken.end - endToken.text.length);
						data = resolvers.inverseSection({
							name: beginToken.value,
							sectionText: innerText,
							delim: delim,
							partials: partials,
							contextStack: contextStack
						});

						if (!data || (util.isArray(data) && !data.length)) {
							data = true;
						} else {
							data = false;
						}

						if (!data || (util.isArray(data) && !data.length)) {
							template.replace({
								begin: beginToken.start,
								end: endToken.end
							});
						} else {
							template.replace({
								begin: beginToken.start,
								end: endToken.end,
								repl: helpers.renderSection({
									template: innerText,
									data: data,
									contextStack: contextStack,
									partials: partials,
									delim: delim
								})
							});
						}
					}
				},
				makeInterpreter = function () {
					return {
						// Interprets a mustache template and returns the result as a string.
						interpret: function (template, data, partials, delimiters, disableRecursion) {
							return internalInterpreter.interpret({
								template: template,
								data: data,
								partials: partials,
								delim: delimiters,
								disableRecursion: disableRecursion
							});
						}
					};
				};

			makeInterpreter.resolvers = resolvers;

			internalInterpreter = {
				// template - the template string
				// data - [OPTIONAL] the data or context to use for expansion
				// partials - [OPTIONAL] a hash containing partial templates to be used in partial expansion
				// delim - [OPTIONAL] the left and right delimters as: {left, right}
				// contextStack - [INTERNAL USE ONLY] the context stack to use for this parse command
				interpret: function (args) {
					var template = makeMutableString(args.template ? args.template.toString() : ''),
						partials = args.partials || {},
						data = args.data || {},
						parser = makeParser(template),
						delim = args.delim || makeTokenizer.defaultDelimiter(),
						contextStack = args.contextStack || makeContextStack(),
						disableRecursion = args.disableRecursion,
						token = null,
						state = {
							template: template,
							data: data,
							contextStack: contextStack,
							partials: partials,
							delim: delim,
							disableRecursion: disableRecursion
						};

					// Push our data onto our context stack.
					contextStack.push(data);
					token = parser.next(delim);

					// Iterate over each token in the template and parse accordingly.
					while (token) {
						state.token = token;

						switch (token.type) {
						case 'implicit':
							interpreters.implicit(state);
							break;
						case 'comment':
							helpers.replaceStandaloneToken(template, token);
							break;
						case 'set-delimiter':
							interpreters.setDelimiter(state);
							break;
						case 'interpolation':
							interpreters.interpolation(state);
							break;
						case 'unescape-interpolation':
							interpreters.unescapedInterpolation(state);
							break;
						case 'partial':
							interpreters.partial(state);
							break;
						case 'section-begin':
							interpreters.section(state);
							break;
						case 'invert-section-begin':
							interpreters.inverseSection(state);
							break;
						case 'text':
							// Do nothing.
							break;
						default:
							throw new Error('Unexpected token: "' + token.text + '" on line ' + token.line);
						}

						token = parser.next(delim);
					}

					// If there is still a section open then we throw an error
					// because we are expecting section-end token.
					if (parser.hasOpenSection()) {
						token = parser.getOpenedSectionToken();
						throw new Error('Missing section-end for : "' + token.text + '" on line ' + token.line);
					}

					contextStack.pop();

					// By this point the template has been completely parsed.
					return template.toString();
				}
			};

			return makeInterpreter;
		}()),
		inspect = function (template, data, partials, delimiters) {
			var accessors = [],
				nativeValueOf = ({}).valueOf,
				parser = makeParser(template),
				delim = delimiters || makeTokenizer.defaultDelimiter(),
				token = parser.next(delim),
				contextStack = makeContextStack(data),
				makeImplicitAccessor = function () {
					var value = contextStack.context();

					return {
						"name": function () {
							return '.';
						},
						"context": function () {
							return value;
						},
						"get": function () {
							if (value && value.valueOf !== nativeValueOf && typeof value.valueOf === 'function') {
								return value.valueOf();
							}

							return value;
						},
						"rawget": function () {
							return value;
						},
						"set": function (v) {
							if (typeof value === 'function') {
								value(v);
							}
						}
					};
				},
				makePartialAccessor = function (token) {
					var pieces = token.value.split('.'),
						name = pieces.pop(),
						o = partials;

					if (pieces.length) {
						o = makeInterpreter.resolvers.partial({
							name: pieces.join('.'),
							partials: partials
						});
					}

					return {
						"name": function () {
							if (pieces.length) {
								return pieces.join('.') + '.' + name;
							}

							return name;
						},
						"context": function () {
							return o;
						},
						"get": function () {
							var ret = o[name];

							if (ret && ret.valueOf !== nativeValueOf && typeof ret.valueOf === 'function') {
								ret = ret.valueOf();
							}

							return ret;
						},
						"rawget": function () {
							if (o) {
								return o[name];
							}
						},
						"set": function (value) {
							if (typeof o[name] === 'function') {
								o[name](value);
							} else {
								o[name] = value;
							}
						}
					};
				},
				makeInterpolationAccessor = function (token) {
					var pieces = token.value.split('.'),
						name = pieces.pop(),
						o = contextStack.context();

					if (pieces.length) {
						o = makeInterpreter.resolvers.interpolation({
							name: pieces.join('.'),
							contextStack: contextStack,
							partials: partials
						});
					}

					return {
						"name": function () {
							if (pieces.length) {
								return pieces.join('.') + '.' + name;
							}

							return name;
						},
						"context": function () {
							return o;
						},
						"get": function () {
							var ret;

							if (o) {
								ret = o[name];
							}

							if (ret && ret.valueOf !== nativeValueOf && typeof ret.valueOf === 'function') {
								return ret.valueOf();
							}

							return ret;
						},
						"rawget": function () {
							if (o) {
								return o[name];
							}
						},
						"set": function (value) {
							if (o) {
								if (typeof o[name] === 'function') {
									o[name](value);
								} else {
									o[name] = value;
								}
							}
						}
					};
				},
				makeSectionAccessor = function (token, resolve) {
					var pieces = token.value.split('.'),
						name = pieces.pop(),
						o = contextStack.context(),
						endToken = token.endToken,
						sectionText = template.substring(token.start + token.text.length, endToken.end - endToken.text.length);

					if (pieces.length) {
						o = resolve({
							name: pieces.join('.'),
							sectionText: sectionText,
							delim: delim,
							partials: partials,
							contextStack: contextStack
						});

						token.value += '.' + name;
					}

					return {
						"name": function () {
							if (pieces.length) {
								return pieces.join('.') + '.' + name;
							}

							return name;
						},
						"context": function () {
							return o;
						},
						"get": function () {
							var ret;

							if (o) {
								ret = o[name];
							}

							if (ret && ret.valueOf !== nativeValueOf && typeof ret.valueOf === 'function') {
								return ret.valueOf();
							}

							return ret;
						},
						"rawget": function () {
							if (o) {
								return o[name];
							}
						},
						"set": function (value) {
							if (o) {
								if (typeof value === 'function') {
									o[name](value);
								} else {
									o[name] = value;
								}
							}
						}
					};
				};

			// Iterate over each token in the template and parse accordingly.
			while (token) {
				switch (token.type) {
				case 'implicit':
					accessors.push(makeImplicitAccessor());
					break;
				case 'partial':
					accessors.push(makePartialAccessor(token));
					break;
				case 'interpolation':
				case 'unescape-interpolation':
					accessors.push(makeInterpolationAccessor(token));
					break;
				case 'section-begin':
					accessors.push(makeSectionAccessor(token, makeInterpreter.resolvers.section));
					break;
				case 'invert-section-begin':
					accessors.push(makeSectionAccessor(token, makeInterpreter.resolvers.inverseSection));
					break;
				}

				token = parser.next(delim);
			}

			return accessors;
		},
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
}());