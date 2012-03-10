# Overview

Mustachejs is an implementation of the mustache template specification for JavaScript.
This implementation is different than [mustache.js](https://github.com/janl/mustache.js) by
virtue of the following features:

- Regular expressions are not used in order to mitigate overhead and improve performance.
- The complete [mustache specification](https://github.com/mustache/spec) is implemented, including lambdas.
- The source code is well commented and easier to learn from.

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

Windows

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


# API

The mustachejs module exposes a simple API.

	MUSTACHE is the global object containing the mustachejs API.


	Attempts to render the specified mustache template.

	This method will throw an error if any syntax errors are encountered.

	@template (string) The mustache template to render.
	@data (object) [optional] The data to provide the template (i.e. context).
	@paritals (object) [optional] An object that is searched for partial tempaltes by key.
	@return (string) The rendered template.

	MUSTACHE.render(template, data, partials)