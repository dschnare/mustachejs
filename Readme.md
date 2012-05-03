# Overview

Mustachejs is an implementation of the mustache template specification for JavaScript.
This implementation has the following features:

- Regular expressions are not used in order to mitigate overhead and improve performance.
- The complete [mustache specification](https://github.com/mustache/spec) is implemented, including lambdas.
- The source code is well commented and easy to learn from.

For help with the mustache syntax see the following [manpage](http://mustache.github.com/mustache.5.html).


# Organization

This project is organized into the following partitions/abstractions.

- src

	This directory contains all source code that implements mustachejs.

- vendor

	This directory contains all the required third party binaries and source code.

	The following third party dependencies exist:

		- AjaxMin.exe (used to minify the JavaScript source -- Requires Windows)
		- jslint.js (used to test the JavaScript source)
		- rhino.jar (used to execute jslint.js)

- web

	This directory is a web project used to test against the mustache specification.


# Building

Ruby Rake is used to build the mustachejs module. Use `rake -D` to list all the rake tasks.
The `Rakefile` is commented quite well so you can read this file to understand how
the mustachejs module is built and minified.

The `src` directory contains the source code that implements mustachejs. The source code
is broken out into individual files that can be easily digested. These smaller files can be
thought of as mini-modules. The mustachejs module is constructed from the `_mustache.js` template
file and including the appropriate mini-module.


# Testing

Any web server can be used to serve up the testing project, but for convenience a Sinatra web app
has been written to get testing quickly.

To get started with the built-in Sinatra app run (requires [Bundler](http://gembundler.com/) and [Foreman](https://github.com/ddollar/foreman)):

Mac/Linux/Unix:

	bundle install
	foreman start

Windows (does not require Foreman)

	bundle install
	bundle exec ruby -Cweb app.rb -p 5000

Once the web server is running then simply point your browser to [http://localhost:5000](http://localhost:5000).
To kill the web server press `Ctr+C`.

# Support

Browsers and environments will be added to this list as testing ensues.

- Chrome
- Firefox 8+
- Opera 11+
- Safari 5+
- IE 7/8/9/10 Preview
- [Nodejs](http://nodejs.org/docs/latest/api/modules.html)/[CommonJS Module](http://wiki.commonjs.org/wiki/Modules/1.1)
- [AMD Module](https://github.com/dschnare/definejs)


# Syntax

The entire Mustache [specification](https://github.com/mustache/spec) and syntax is fully supported, including lambdas. However, the mustache syntax has been extended to support alternate forms for `unescaped-interpolation` and `partials`. This extended form is added to support mixing mustache tempaltes with XML/HTML documents.

Partials can not only be referenced as usual; `{{>partial-name}}`, but also like `{{@partial-name}}`.
Unescaped interpolations can not only be referenced as usual; `{{&property}}`, but also like `{{~property}}`.

# Custom valueOf() method

If any object encountered by mustachejs has a custom `valueOf` implementation then it will be used to convert the object into a value.

	var M = MUSTACHE,
			template = '{{message}}, age:{{age}}',
			model = {
				message: {
					toString: function () {
						return 'Hello World!';
					}
				},
				age: function () {
					return 29;
				}
			};

		model.age.valueOf = function () {
			return 30;
		};

		// Writes: {{message}}, age:{{age}} | Hello World!, age:30
		console.log(template, '|', M.render(template, model));

		// Removing the custom valueOf() method on our age() method
		// will result in age() being invoked normally.
		delete model.age.valueOf;
		// Writes: {{message}}, age:{{age}} | Hello World!, age:29
		console.log(template, '|', M.render(template, model));

# Recursive Rendering

Unlike standard mustache engines, mustachejs attempts to recursively render any data value from properties or lambdas. The reason for this deviation is because the specification does not state any rules for recursive rendering other than that it must occur for lambdas. By assuming that at any time a new template could potentially be returned, mustachejs recursively renders all results, making it extremely easy to create dynamic templates.

# Section Rendering

To make rendering sections more customizable mustachejs provides a render function argument to lambdas or functions in the member selection chain of a section. This render function accepts a template and an optional model/data argument that will override the current data context. For example:

	var data = {cards: ['kh', 'ks', 'kc', 'kd', 'as'], player: {name: 'Alex', score: 2034}};

	{{player.name}}: {{player.score}}
	Hand: {{#cards}}{{.}}{{/cards}}

We can easily modify how cards are rendered by doing the following:

	data.displayCard = function (template, render) {
		var face = '',
			suit = '';

		// Renders: {{.}} as a value like 'ks'
		// We don't specify a data context of our own
		// because we want the card to be rendered as is.
		// We could have did something like this:
		// template = render(template, {specific data});
		// to override the current data context.
		template = render(template);

		switch (template.charAt(0)) {
		case 'k':
			face = 'King';
			break;
		case 'a':
			face = 'Ace';
			break;
		}

		switch (template.charAt(1)) {
		case 's':
			suit = 'Spades';
			break;
		case 'd':
			suit = 'Diamonds';
			break;
		case 'h':
			suit = 'Herats';
			break;
		case 'c':
			suit = 'Clubs';
			break;
		}

		return face + ' of ' + suit;
	};

	{{player.name}}: {{player.score}}
	Hand: {{#cards}}{{#displayCard}}{{.}}{{/displayCard}},{{/cards}}

The `render` function has the following signature:

	render function(template, data) {}

Where `data` is an option data object used in place of the current data context.

# API

The mustachejs module exposes a simple API.

	MUSTACHE is the global object containing the mustachejs API.
	Note that this global object is only created if mustachejs is not
	required via an AMD or CommonJS module loader.


	Attempts to render the specified mustache template.

	This method will throw an error if any syntax errors are encountered.

	@template (string) The mustache template to render.
	@data (object) [optional] The data to provide the template (i.e. context).
	@paritals (object) [optional] An object that is searched for partial tempaltes by key.
	@return (string) The rendered template.

	MUSTACHE.render(template, data, partials)