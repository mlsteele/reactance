var BackboneEvents = require("backbone-events-standalone");

module.exports = Store

function Store() {
    this._eventer = BackboneEvents.mixin({})
    this._emitChangeBatcher = null
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
 * Fire a change event for this store
 * This should probably only be called by the store itself
 * after it mutates state.
 *
 * These are batched using setTimeout.
 * I don't actually know enough to know whether this is a good idea.
 * But it's fun to think about.
 * This is NOT done for performance, but to only emit changes
 * when the store has settled into a consistent state.
 */
Store.prototype.emitChange = function() {
    if (this._emitChangeBatcher === null) {
        this._emitChangeBatcher = setTimeout(function() {
            this._eventer.trigger('change')
            this._emitChangeBatcher = null
        }.bind(this), 10)
    }
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
