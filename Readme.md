# Overview

Mustachejs is an implementation of the mustache template specification for JavaScript.
This implementation is different than [mustache.js](https://github.com/janl/mustache.js) by
virtue of the following features:

- Regular expressions are not used in order to mitigate overhead and improve performance.
- The complete [mustache specification](https://github.com/mustache/spec) is implemented, including lambdas.
- The source code is well commented and easier to learn from.

This is not to say that [mustache.js](https://github.com/janl/mustache.js) is inadequate in any way.
However, I was a bit disappointed when I discovered the entire mustache specification was not
implemented. I was also quite curious how one would write a mustache implementation without regular expressions.

For help with the mustache syntax see the following [manpage](http://mustache.github.com/mustache.5.html).


# Organization

This project is organized into the following partitions/abstractions.

- src

	This directory contains all source code that implements mustachejs.

- vendor

	This directory contains all the required third party binaries and source code.

	The following third party dependencies exist:
		- AjaxMin.exe (used to minify the JavaScript source)
		- jslint.js (used to test the JavaScript source)
		- rhino.jar (used to execute jslint.js)

- web

	This directory is a web project used to test the mustache specification.


# Building

Ruby Rake is used to build the mustachejs module. Use `rake -D` to list all the rake tasks.
The `Rakefile` is commented quite well so you can also read this file to understand how
the mustachejs module is built and minified.

The `src` directory contains the source code that implements mustachejs. The source code
is broken out into individual files that can be easily digested. These smaller files can be
thought of as mini-modules. The mustachejs module is constructed from the `_mustache.js` template
file.


# Testing

Any web server can be used to serve up the testing project, but for convenience a Sinatra web app
has been written to get testing quickly.

To get started with the built-in Sinatra app run:

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