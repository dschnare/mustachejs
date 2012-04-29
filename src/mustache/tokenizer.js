(function (util) {
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

							break;
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
}(util));