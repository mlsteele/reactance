var BackboneEvents = require("backbone-events-standalone");

module.exports = Dispatcher

function Dispatcher() {
    this._eventer = BackboneEvents.mixin({})
}

/**
 * payload should include an `action` key.
 */
Dispatcher.prototype.dispatch = function(payload) {
    this._eventer.trigger('action', payload)
}

/**
 * Prepare a simple dispatch function
 */
Dispatcher.prototype.bake = function(action, field) {
    return function(input) {
        var payload = {action: action}
        if (field != undefined) {
            payload[field] = input
        }
        this.dispatch(payload)
    }.bind(this)
}

Dispatcher.prototype.onAction = function(callback) {
    this._eventer.on('action', callback)
}

Dispatcher.prototype.offAction = function(callback) {
    this._eventer.off('action', callback)
}
