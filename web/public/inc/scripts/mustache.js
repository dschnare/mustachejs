/*
Author: Darren Schnare
Keywords: javascript,mustache,template
License: MIT ( http://www.opensource.org/licenses/mit-license.php )
Repo: https://github.com/dschnare/mustachejs
*/
var MUSTACHE = (function () {
	'use strict';

	var k = null,
		util = (function () {
			'use strict';
		
			// The util object represents a set of utilitarian functions.
		
			return {
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
			};
		}()),
		makeTokenizer = (function (util) {
			'use strict';
		
			/*jslint 'continue': true*/
			/*global 'util'*/
		
			// This represents a tokenizer for mustache markup.
			// The tokenizer does not use regular expressions, instead
			// it iterates over each character.
		
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
					// Alternate designator character for HTML/XML documents.
					'~': 'unescape-interpolation',
					// Use the '{' character to identify unescaped
					// interpolation (i.e. tripple mustache).
					'{': 'unescape-interpolation',
					'#': 'section-begin',
					'^': 'invert-section-begin',
					'/': 'section-end',
					'>': 'partial',
					// Alternate designator character for HTML/XML documents.
					'@': 'partial',
					'.': 'implicit'
				},
				// Makes a tokenizer that will tokenize the specified mustache template.
				// The tokenizer will only tokenize on an as-needed basis by calling next().
				// The next() method will return null if there are no more tokens available.
				makeTokenizer = function (str) {
					var pointer = typeof str.pointer === 'function' ? function (index) { return str.pointer(index); } : function (index) {
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
								c = str.charAt(+i);
							}
		
							return c;
						},
						lookahead = function (count) {
							return str.substr(+i, count);
						};
		
					return {
						// Retrive an object with the default mustache delimiters.
						defaultDelimiter: function () {
							return makeTokenizer.defaultDelimiter();
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
									if (str.charAt(i - 1) !== '\r') {
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
									// Variable.
									default:
										value += c;
									}
		
									// Read the value of the token.
									while (next()) {
										// Handle 'tripple mustache' specifically (i.e. read the first '}' and do nothing).
										if (!(modifier === '{' && delimright === '}}' && lookahead(delimrightlen + 1) === '}}}')) {
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
									return {
										type: tokenType,
										value: util.trim(value),
										text: str.substring(start, +i),
										start: pointer(start),
										end: pointer(+i),
										line: line
									};
								}
							}
		
							// No token found.
							return null;
						}
					};
				};
		
			// The makeTokenizer() function also exposes the
			// default mustache delimiter object.
			makeTokenizer.defaultDelimiter = function () {
				return {
					left: '{{',
					right: '}}'
				};
			};
		
			return makeTokenizer;
		}(util)),
		makeMutableString = (function () {
			'use strict';
		
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
		
			return function (str) {
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
			};
		}()),
		makeContextStack = (function () {
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
		}()),
		makerParser = (function (util, makeMutableString, makeTokenizer, makeContextStack) {
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
						if (data.length === 1) {
							data = parser.parse({
								template: data.call(data, sectionText),
								data: contextStack.context(),
								partials: partials,
								delim: delim
							});
						} else {
							data = parser.parse({
								template: data.call(data),
								data: contextStack.context(),
								partials: partials
							});
						}
					} else {
						for (i = 0; i < len; i += 1) {
							name = names[i];
							data = ctxStack.get(name);
		
							if (data !== undefined) {
								if (typeof data === 'function') {
									if (data.length === 1) {
										data = data.call(data, sectionText);
									} else {
										data = data.call(data);
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
									if (data.length === 1) {
										data = data.call(data, sectionText);
									} else {
										data = data.call(data);
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
							template: data.call(data),
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
				};
		
			// Return a 'maker' function to make a new parser.
			return function () {
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
							// This is a convenience function that looksahead to retrieve the
							// ending section token for the specified section token.
							getEndSectionToken = function (beginToken) {
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
							},
							parseSection = function (beginToken) {
								var endToken = getEndSectionToken(beginToken),
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
								var endToken = getEndSectionToken(beginToken),
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
			};
		}(util, makeMutableString, makeTokenizer, makeContextStack)),
		MUSTACHE = {
			makeTokenizer: makeTokenizer,
			render: function (template, data, partials) {
				var parser = makerParser();

				return parser.parse({
					template: template,
					data: data,
					partials: partials
				});
			}
		};

	// Asynchronous modules (AMD) supported.
	if (typeof define === 'function' &&
		typeof define.amd === 'object') {

		define(MUSTACHE);
		MUSTACHE = undefined;

	// Nodejs/CommonJS modules supported.
	} else if (typeof exports !== 'undefined') {

		for (k in MUSTACHE) {
			exports[k] = MUSTACHE[k];
		}
		MUSTACHE = undefined;
	}

	return MUSTACHE;
}());