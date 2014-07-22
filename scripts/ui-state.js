var Store = require('./store')

module.exports = UIState

function UIState(dispatcher) {
    Store.mixin(this)

    this.selectedPlayer = null
    this.displayMode = 'list'

    dispatcher.onAction(function(payload) {
        var actions = UIState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
        }
    }.bind(this))
}

UIState.actions = {}

UIState.actions.selectPlayer = function({name}) {
    console.log('selecting', name)
    this.selectedPlayer = name
    this.displayMode = 'confirm'
    this._emitChange()
}

UIState.actions.confirmPlayer = function({name}) {
    console.log('confirming', name)
    this.selectedPlayer = name
    this.displayMode = 'role'
    this._emitChange()
}

UIState.actions.deselectPlayer = function() {
    console.log('deselecting')
    this.selectedPlayer = null
    this.displayMode = 'list'
    this._emitChange()
}
