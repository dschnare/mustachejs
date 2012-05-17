function $() {}

/** @constructor */
function Promise() {}
Promise.prototype.done = function () {};

/**
 * @constructor
 * @extends Promise
 */
$.Deferred = function () {};
/** @return {$.Deferred} */
$.Deferred.prototype.pipe = function () {};
/** @return {Promise} */
$.Deferred.prototype.promise = function () {};
/** @return {$.Deferred} */
$.Deferred.prototype.resolve = function () {};

/** @return {$.Deferred} */
$.ajax = function () {};