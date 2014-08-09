/**
 * Flux Dispatcher
 *
 * Dispatches actions to listeners registered using onAction.
 * Actions are deliverd as payloads like
 *   {action: 'changeSettings', color: color}
 * The 'action' key is required, all other keys are up to the application.
 */
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
 * Shorthand to prepare a simple dispatch function.
 * Does not fire an event, but returns a function that can.
 * These are equivalent:
 * dispatcher.bake('changeSetting', 'color')
 * (color) => { dispatcher.dispatch('changeSetting', {color: color}) }
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

/**
 * Register a callback to receive all actions.
 * Example:
 * dispatcher.onAction((action) => {
 *   console.log(`got action of type ${payload.action}`
 * })
 */
Dispatcher.prototype.onAction = function(callback) {
    this._eventer.on('action', callback)
}

/**
 * Unregister a callback previously registered with onAction.
 */
Dispatcher.prototype.offAction = function(callback) {
    this._eventer.off('action', callback)
}
