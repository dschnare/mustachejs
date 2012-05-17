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
					// {name, sectionText, contextStack}
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
							partials = args.partials;

						data = internalInterpreter.interpret({
							template: typeof data === 'function' ? data() : data,
							data: contextStack.context(),
							contextStack: contextStack,
							partials: partials
						});

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
							temp = resolvers.interpolation({
								name: token.value,
								contextStack: contextStack,
								partials: partials
							});

						temp = internalInterpreter.interpret({
							template: temp,
							data: contextStack.context(),
							contextStack: contextStack,
							partials: partials
						});

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
							temp = resolvers.interpolation({
								name: token.value,
								contextStack: contextStack,
								partials: partials
							});

						temp = internalInterpreter.interpret({
							template: temp,
							data: contextStack.context(),
							contextStack: contextStack,
							partials: partials
						});

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
							temp = internalInterpreter.interpret({
								template: partialText,
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
							data = null;

						helpers.trimStandaloneToken(template, endToken);
						helpers.trimStandaloneToken(template, beginToken);

						innerText = template.substring(beginToken.start + beginToken.text.length, endToken.end - endToken.text.length);
						data = resolvers.section({
							name: beginToken.value,
							sectionText: innerText,
							contextStack: contextStack,
							delim: delim,
							partials: partials
						});

						if (typeof data === 'string') {
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
						interpret: function (template, data, partials) {
							return internalInterpreter.interpret({
								template: template,
								data: data,
								partials: partials
							});
						}
					};
				};

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
						token = null,
						state = {
							template: template,
							data: data,
							contextStack: contextStack,
							partials: partials,
							delim: delim
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