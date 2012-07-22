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
								throw new Error('Missing section-begin for : "' + endToken.text + '" on line ' + endToken["line"]);
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
									throw new Error('Unexpected whitespace in set-delimiter token : "' + token.text + '" on line ' + token["line"]);
								}

								token.left = left;
								token.right = right;
							} else {
								throw new Error('Invalid set-delimiter token : "' + token.text + '" on line ' + token["line"]);
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