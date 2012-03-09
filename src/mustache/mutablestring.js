(function () {
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
}());