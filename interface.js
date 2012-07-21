var MUSTACHE = {
	inspect: function () {},
	render: function () {}
};

function Accessor() {}
Accessor.prototype.name = function () {};
Accessor.prototype.token = function () {};
Accessor.prototype.context = function () {};
Accessor.prototype.get = function () {};
Accessor.prototype.rawget = function () {};
Accessor.prototype.set = function () {};

function Token() {}
Token.prototype.end = 0;
Token.prototype.start = 0;
Token.prototype.line = 0;
Token.prototype.text = "";
Token.prototype.type = "";
Token.prototype.value = "";
Token.prototype.endToken = {};