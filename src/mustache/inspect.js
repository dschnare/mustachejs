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
						context: function () {
							return value;
						},
						get: function () {
							if (value && value.valueOf !== nativeValueOf && typeof value.valueOf === 'function') {
								return value.valueOf();
							}

							return value;
						},
						set: function (v) {
							if (typeof value === 'function') {
								value(v);
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
						context: function () {
							return o;
						},
						get: function () {
							var ret;

							if (o) {
								ret = o[name];
							}

							if (ret && ret.valueOf !== nativeValueOf && typeof ret.valueOf === 'function') {
								return ret.valueOf();
							}

							return ret;
						},
						set: function (value) {
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
						context: function () {
							return o;
						},
						get: function () {
							var ret;

							if (o) {
								ret = o[name];
							}

							if (ret && ret.valueOf !== nativeValueOf && typeof ret.valueOf === 'function') {
								return ret.valueOf();
							}

							return ret;
						},
						set: function (value) {
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