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
			// Use the '{' character to identify unescaped
			// interpolation (i.e. tripple mustache).
			'{': 'unescape-interpolation',
			'#': 'section-begin',
			'^': 'invert-section-begin',
			'/': 'section-end',
			'>': 'partial',
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
}(util));