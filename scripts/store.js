var BackboneEvents = require("backbone-events-standalone");

module.exports = Store

function Store() {
    this._eventer = BackboneEvents.mixin({})
}

Store.prototype.onChange = function(callback) {
    this._eventer.on('change', callback)
}

Store.prototype.offChange = function(callback) {
    this._eventer.off('change', callback)
}

Store.prototype._emitChange = function() {
    this._eventer.trigger('change')
}

Store.mixin = function(obj) {
    var store = new Store()
    obj.onChange = store.onChange.bind(store)
    obj.offChange = store.offChange.bind(store)
    obj._emitChange = store._emitChange.bind(store)
}
