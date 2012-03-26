(function (util, makeMutableString, makeTokenizer, makeContextStack) {
	'use strict';

	/*global 'util', 'makeMutableString', 'makeTokenizer', 'makeContextStack'*/

	// This represents a mustache parser/interpreter.
	// This parser will throw an error if any syntax errors
	// are detected (i.e. unballanced section tokens, invalid
	// set-delimiter token, etc.) and will interpret the tokens
	// according to the official mustache specification.

		// Perform name resolution for section tokens.
	var resolveNameOfSection = function (name, sectionText, contextStack, delim, partials, parser) {
			var names = name.split('.'),
				i = 0,
				data = contextStack.get(name),
				len = names.length,
				ctxStack = contextStack;

			sectionText = sectionText.toString();

			if (typeof data === 'function') {
				// When used as the data value for an Interpolation tag, the lambda MUST be
				// treatable as an arity 0 function, and invoked as such.  The returned value
				// MUST be rendered against the default delimiters, then interpolated in place
				// of the lambda. -- https://github.com/mustache/spec/blob/master/specs/~lambdas.yml
				//if (data.length === 1) {
				data = parser.parse({
					template: data.call(undefined, sectionText),
					data: contextStack.context(),
					partials: partials,
					delim: delim
				});
				/*} else {
					data = parser.parse({
						template: data.call(undefined),
						data: contextStack.context(),
						partials: partials
					});
				}*/
			} else {
				for (i = 0; i < len; i += 1) {
					name = names[i];
					data = ctxStack.get(name);

					if (data !== undefined) {
						if (typeof data === 'function') {
							if (data.length === 1 || data.length === 2) {
								data = data.call(undefined, sectionText);
							} else {
								data = data.call(undefined);
							}
						}

						ctxStack = makeContextStack(data);
					// Resolution failed.
					} else {
						data = '';
					}
				}
			}

			return data;
		},
		// Perform name resolution for inverted section tokens.
		resolveNameOfInverseSection = function (name, sectionText, contextStack) {
			var names = name.split('.'),
				i = 0,
				data = contextStack.get(name),
				len = names.length,
				ctxStack = contextStack;

			sectionText = sectionText.toString();

			if (typeof data === 'function') {
				data = true;
			} else {
				for (i = 0; i < len; i += 1) {
					name = names[i];
					data = ctxStack.get(name);

					if (data !== undefined) {
						if (typeof data === 'function') {
							if (data.length === 1 || data.length === 2) {
								data = data.call(undefined, sectionText);
							} else {
								data = data.call(undefined);
							}
						}

						ctxStack = makeContextStack(data);
					// Resolution failed.
					} else {
						data = '';
					}
				}
			}

			return data;
		},
		// Perform name resolution for interpolation tokens.
		resolveNameOfInterpolation = function (name, contextStack, parser) {
			var names = name.split('.'),
				i = 0,
				data = contextStack.get(name),
				len = names.length,
				ctxStack = contextStack;

			if (typeof data === 'function') {
				data = parser.parse({
					template: data.call(undefined),
					data: contextStack.context(),
					partials: {}
				});
			} else if (name === '.') {
				data = contextStack.context();
			} else {
				for (i = 0; i < len; i += 1) {
					name = names[i];
					data = ctxStack.get(name);

					if (data !== undefined) {
						if (typeof data === 'function') {
							data = data();
						}

						ctxStack = makeContextStack(data);
					// Resolution failed.
					} else {
						data = '';
					}
				}
			}

			return data;
		},
		// Renders a mustache section.
		// The 'args' argument is an object with the following properties:
		//
		// template - the template string
		// data - the data or context to use for expansion
		// contextStack - the context stack
		// partials - a hash containing partial templates to be used in partial expansion
		// parser - the parser instance
		// delim - the left and right delimiters as: {left, right}
		renderSection = function (args) {
			var template = args.template,
				data = args.data,
				delim = args.delim,
				contextStack = args.contextStack,
				partials = args.partials,
				parser = args.parser,
				i = 0,
				len = 0,
				str = '',
				temp = null;

			if (!util.isArray(data)) {
				if (data) {
					data = [data];
				} else {
					data = [];
				}
			}

			len = data.length;

			for (i = 0; i < len; i += 1) {
				contextStack.push(data[i]);
				temp = parser.parse({
					// Prefix and postfix the template artificially
					// so that the first and last tokens do
					// not get treated as standalone.
					template: '=' + template + '=',
					data: data[i],
					contextStack: contextStack,
					partials: partials,
					delim: delim
				});
				str += temp.substring(1, temp.length - 1);
				contextStack.pop();
			}

			return str;
		},
		// A standalone token is any token that appears on its own line.
		// Standalone tokens are to be trimmed such that all leading whitespace
		// upto but not including the first newline are trimmed and all trailing
		// whitespace upto and including the first newline are trimmed.
		trimStandaloneToken = function (token, template) {
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
		// This is a convenience function that looksahead to retrieve the
		// ending section token for the specified section token.
		getEndSectionToken = function (beginToken, tokenizer, delim) {
			var token = tokenizer.next(delim),
				tokens = [];

			while (token) {
				switch (token.type) {
				case 'section-end':
					if (tokens.length && token.value === tokens[tokens.length - 1].value) {
						tokens.pop();
					} else if (beginToken.value === token.value) {
						if (!tokens.length) {
							return token;
						}

						throw new Error('Unbalanced sections encountered: "' + token.text + '" on line ' + token.line);
					}
					break;
				case 'section-begin':
				case 'invert-section-begin':
					tokens.push(token);
					break;
				}

				token = tokenizer.next(delim);
			}

			throw new Error('Missing end-section for section : "' + beginToken.text + '" on line ' + beginToken.line);
		};

	return {
		makeParser: function () {
			return {
				// Parses a mustache template and returns the result as a string.
				// The 'args' argument is an object with the following properties:
				//
				// template - the template string
				// data - [OPTIONAL] the data or context to use for expansion
				// partials - [OPTIONAL] a hash containing partial templates to be used in partial expansion
				// delim - [OPTIONAL] the left and right delimters as: {left, right}
				// contextStack - [INTERNAL USE ONLY] the context stack to use for this parse command
				parse: function (args) {
					var template = makeMutableString(args.template ? args.template.toString() : ''),
						partials = args.partials || {},
						data = args.data || {},
						tokenizer = makeTokenizer(template),
						delim = args.delim || tokenizer.defaultDelimiter(),
						contextStack = args.contextStack || makeContextStack(),
						parser = this,
						token = null,
						// Helper function to replace a token in the mustache template.
						replaceToken = function (token, repl) {
							template.replace({begin: token.start.value, end: token.end.value, repl: repl});
						},
						// Helper function to replace a token that can appear as standalone, in the mustache template.
						replaceStandaloneToken = function (token, repl) {
							trimStandaloneToken(token, template);
							template.replace({begin: token.start.value, end: token.end.value, repl: repl});
						},

						// The following functions are parsing helper functions.
						//These functions will parse a particular type of mustache token.

						parseSetDelimiter = function (token) {
							var temp, left, right;

							if (token.value && token.value.indexOf('=') < 0) {
								temp = token.value.split(' ');
								left = temp[0];
								right = temp[1];

								if (left.indexOf(' ') >= 0 || right.indexOf(' ') >= 0) {
									throw new Error('Invalid custom delimiter: "' + token.text + '" on line ' + token.line);
								}

								delim.left = left;
								delim.right = right;

								replaceStandaloneToken(token);
							} else {
								throw new Error('Invalid custom delimiter: "' + token.text + '" on line ' + token.line);
							}
						},
						parseInterpolation = function (token) {
							var temp = resolveNameOfInterpolation(token.value, contextStack, parser);

							if (temp) {
								temp = util.htmlEscape(temp.toString());
								replaceToken(token, temp);
							} else {
								replaceToken(token);
							}
						},
						parseUnescapedInterpolation = function (token) {
							var temp = resolveNameOfInterpolation(token.value, contextStack, parser);

							if (temp) {
								temp += '';
								replaceToken(token, temp);
							} else {
								replaceToken(token);
							}
						},
						parsePartial = function (token) {
							var temp = '',
								leading = trimStandaloneToken(token, template),
								partialText = partials[token.value];

							if (partialText) {
								// If there is whitespace leading the token then
								// we use this leading as the indentation for the
								// partial template. It's key to indent the partial
								// template BEFORE it is parsed.
								if (leading) {
									partialText = util.indent(partialText, leading);
								}

								// Now parse the partial template.
								temp = parser.parse({
									template: partialText,
									data: data,
									contextStack: contextStack,
									partials: partials
								});
							}

							replaceToken(token, temp);
						},
						parseSection = function (beginToken) {
							var endToken = getEndSectionToken(beginToken, tokenizer, delim),
								innerText = null,
								data = null;

							if (!endToken) {
								throw new Error('Unbalanced sections encountered: "' + beginToken.text + '" on line ' + beginToken.line);
							}

							trimStandaloneToken(endToken, template);
							trimStandaloneToken(beginToken, template);

							innerText = template.substring(beginToken.start + beginToken.text.length, endToken.end - endToken.text.length);
							data = resolveNameOfSection(beginToken.value, innerText, contextStack, delim, partials, parser);

							if (typeof data === 'string') {
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
									repl: renderSection({
										template: innerText,
										data: data,
										contextStack: contextStack,
										partials: partials,
										parser: parser,
										delim: delim
									})
								});
							}
						},
						parseInverseSection = function (beginToken) {
							var endToken = getEndSectionToken(beginToken, tokenizer, delim),
								innerText = null,
								data = null;

							if (!endToken) {
								throw new Error('Unbalanced sections encountered: "' + beginToken.text + '" on line ' + beginToken.line);
							}

							trimStandaloneToken(endToken, template);
							trimStandaloneToken(beginToken, template);

							innerText = template.substring(beginToken.start + beginToken.text.length, endToken.end - endToken.text.length);
							data = resolveNameOfInverseSection(beginToken.value, innerText, contextStack);

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
									repl: renderSection({
										template: innerText,
										data: data,
										contextStack: contextStack,
										partials: partials,
										parser: parser,
										delim: delim
									})
								});
							}
						};

					// Push our data onto our context stack.
					contextStack.push(data);
					token = tokenizer.next(delim);

					// Iterate over each token in the template and parse accordingly.
					while (token) {
						switch (token.type) {
						case 'implicit':
							replaceToken(token, data);
							break;
						case 'comment':
							replaceStandaloneToken(token);
							break;
						case 'set-delimiter':
							parseSetDelimiter(token);
							break;
						case 'interpolation':
							parseInterpolation(token);
							break;
						case 'unescape-interpolation':
							parseUnescapedInterpolation(token);
							break;
						case 'partial':
							parsePartial(token);
							break;
						case 'section-begin':
							parseSection(token);
							break;
						case 'invert-section-begin':
							parseInverseSection(token);
							break;
						default:
							throw new Error('Unexpected token: "' + token.text + '" on line ' + token.line);
						}

						token = tokenizer.next(delim);
					}

					contextStack.pop();

					// By this point the template has been completely parsed.
					return template.toString();
				}
			};
		}
	};
}(util, makeMutableString, makeTokenizer, makeContextStack));