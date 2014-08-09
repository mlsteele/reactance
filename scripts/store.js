var BackboneEvents = require("backbone-events-standalone");

module.exports = Store

function Store() {
    this._eventer = BackboneEvents.mixin({})
}

/**
 * Register a callback to fire on change events.
 */
Store.prototype.onChange = function(callback) {
    this._eventer.on('change', callback)
}

/**
 * Unregister a callback previously registerd with onChange.
 */
Store.prototype.offChange = function(callback) {
    this._eventer.off('change', callback)
}

/**
 * Fire a change event for this store.
 * This should probably only be called by the store itself
 * after it mutates state.
 */
Store.prototype.emitChange = function() {
    this._eventer.trigger('change')
}

/**
 * Mix into an object to make it a store.
 * Example:
 * function AwesomeStore() {
 *   Store.mixin(this)
 * }
 */
Store.mixin = function(obj) {
    var store = new Store()
    obj.onChange = store.onChange.bind(store)
    obj.offChange = store.offChange.bind(store)
    obj.emitChange = store.emitChange.bind(store)
}
