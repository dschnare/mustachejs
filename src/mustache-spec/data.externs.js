/** @constructor */
function Lambda() {}
/** @type {string} */
Lambda.prototype.js;

/** @constructor */
function TestData() {}
/** @type {Lambda} */
TestData.prototype.lambda;

/** @constructor */
function Test() {}
/** @type {string} */
Test.prototype.name;
/** @type {string} */
Test.prototype.desc;
/** @type {string} */
Test.prototype.template;
/** @type {TestData} */
Test.prototype.data;
/** @type {Object} */
Test.prototype.partials;
/** @type {string} */
Test.prototype.expected;

/** @constructor */
function Data() {}
/** @type {Array.<Test>} */
Data.prototype.tests;