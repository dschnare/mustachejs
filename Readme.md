# Overview

Mustachejs is an implementation of the mustache template specification for JavaScript.
This implementation has the following features:

- Regular expressions are not used in order to mitigate overhead and improve performance.
- The complete [mustache specification](https://github.com/mustache/spec) is implemented, including lambdas.
- The source code is well commented and easy to learn from.
- Can be loaded as an [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) or [NodeJS/CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) module.

For help with the mustache syntax see the following [manpage](http://mustache.github.com/mustache.5.html).


# Building

Ruby Rake is used to build the mustachejs module. Use `rake -D` to list all the rake tasks. For more indepth details on the build system for the project see my [project template](https://github.com/dschnare/project-template) repo, of which this project is based.


# Testing

Any web server can be used to serve up the testing project, but for convenience a Sinatra web app
has been written to get testing quickly.

To get started with the built-in Sinatra app run (requires [Bundler](http://gembundler.com/) and [Foreman](https://github.com/ddollar/foreman)) from the 'web' directory:

Mac/Linux/Unix:

	bundle install
	foreman start

Windows (does not require Foreman)

	bundle install
	bundle exec ruby app.rb -p 5000

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

# Build Products

This project contains several modules that get built into the 'build' directory.

**src/xport** - The xport module that exports a function used to export symbols for the Closure Compiler (< 1Kb when compiled).

- build/xport.js
- build/xport.min.js

**src/mustachejs** - The mustachejs module that exports the mustachejs API. Depends on the xport module.

- build/mustache.js
- build/mustache.min.js
- build/mustache-complete.js (contains xport module)
- build/mustache-complete.min.js (contains compiled xport module)

**src/mustache-spec** - The mustachejs specification module that exports several unit test suites.

- build/mustache-spec.js
- build/mustache-spec.min.js

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

Unlike standard mustache engines, mustachejs attempts to recursively render any data value from properties or lambdas. The reason for this deviation is because the specification does not state any rules for recursive rendering other than that it must occur for lambdas. By assuming that at any time a new template could potentially be returned from an interpolation, mustachejs recursively renders all results, making it extremely easy to create dynamic templates.

Recursive rendering can be thought of as treating interpolation as if it were always a lambda. The following example illustrates the difference.

	var template = "{{display}}",
		data = {
			display: function () {
				return "{{message}}";
			},
			message: "Hello World!"
		};

	MUSTACHE.render(template, data); // Returns "Hello World!"

	// This is the typical behaviour according to the mustache specification for lambdas.
	// All lambda results must be recursively rendered, so the sub-template is correctly interpolated.



	data.display = "{{message}}";
	MUSTACHE.render(template, data); // Returns "Hello World!"

	// In this example we overwrite display to be the literal string "{{message}}" instead of
	// a lambda (i.e. function). Beacuase of recursive rendering, mustachejs will automatically
	// render this sub-template correctly as if it were a lambda.



	MUSTACHE.render(template, data, null, null, true); // Returns "{{message}}"

	// In this example we pass 'null' for both the partials and delimiters arguments, but
	// pass 'true' for the 'disableRecursion' argument. Because recursion is disabled
	// the sub-template will not be rendered but returned as-is instead.



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

	@param template (string) The mustache template to render.
	@param data (object) [optional] The data to provide the template (i.e. context).
	@param paritals (object) [optional] An object that is searched for partial tempaltes by key.
	@param delimiters (object) [optoinal] An object that descibes the default delimiters.
	@param disableRecursion (boolean) [optional] Determines if recursive rendering is disabled.
	@return (string) The rendered template.

	Delimiters is an object of the form: {left: '{{', right: '}}'}

	MUSTACHE.render(template, data, partials, delimiters, disableRecursion)




	Attempts to retrieve an array of all properties being referenced in a mustachio template.
	The properties will be returned as objects with the following properties:

	- name() - The name that appears in the mustache token.
	- get() - Retrieves the value of the property referenced. If the property value has a custom valueOf() method then the result of this method will be returned.
	- rawget() - Retrives the raw value of the property without calling the custom valueOf() method (if it exists).
	- set(value) - Attempts to set the property being referenced. If the value of the property is a function then the function will be called with the new value.
	- context() - The context of the property. Useful if the property value is a function.

	Example:

		var template = '{{name}} {{children.first.name}}';
		var data = {
			name: 'Ninja',
			children: {
				first: {
					name: 'Gaiden'
				},
			}
		};
		var accessors = MUSTACHE.inspect(template, data);

		accessors[0].name(); // 'name'
		accessors[0].get(); // 'Ninja'
		accessors[0].set('Mario'); // Sets data.name to 'Mario'
		accessors[0].context(); // Retrieves data

		accessors[1].name(); // children.first.name
		accessors[1].get(); // 'Gaiden'
		accessors[1].set('Baby Mario'); // Sets data.children.first.name to 'Baby Mario'
		accessors[1].context(); // Retrieves data.children.first

	@param template (string) The mustache template to render.
	@param data (object) [optional] The data to provide the template (i.e. context).
	@param paritals (object) [optional] An object that is searched for partial tempaltes by key.
	@param delimiters (object) [optoinal] An object that descibes the default delimiters.
	@return (Array) Accessor object for each referenced property.

	Delimiters is an object of the form: {left: '{{', right: '}}'}

	MUSTACHE.inspect(template, data, partials, delimiters)