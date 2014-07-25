var BackboneEvents = require("backbone-events-standalone");

module.exports = Dispatcher

function Dispatcher() {
    this._eventer = BackboneEvents.mixin({})
}

/**
 * Dispatch an action.
 * Usage:
 * dispatcher('fidget')
 * dispatcher('fidget', {with: 'pencil'})
 * dispatcher({action: 'fidget', with: 'pencil'})
 */
Dispatcher.prototype.dispatch = function(action, payload) {
    if (_.isString(action)) {
        payload = _.extend({action: action}, payload)
    } else {
        payload = action
    }
    console.log(`dispatch: ${payload.action}`)
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
