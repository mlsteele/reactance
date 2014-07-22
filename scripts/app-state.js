var Store = require('./store')

module.exports = AppState

function AppState(dispatcher) {
    Store.mixin(this)

    this.playerNames = []
    this.selectedPlayer = null
    this.displayMode = 'list'
    this.settings = {
        merlin: false,
    }

    dispatcher.onAction(function(payload) {
        var actions = AppState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
        }
    }.bind(this))
}

AppState.actions = {}

AppState.actions.addPlayer = function(payload) {
    this.playerNames.push(payload.name)
    this._emitChange()
}

AppState.actions.deletePlayer = function(payload) {
    this.playerNames = _.without(this.playerNames, payload.name)
    this._emitChange()
}

AppState.actions.selectPlayer = function(payload) {
    var name = payload.name
    console.log('selecting', name)
    this.selectedPlayer = name
    this.displayMode = 'confirm'
    this._emitChange()
}

AppState.actions.confirmPlayer = function(payload) {
    var name = payload.name
    console.log('confirming', name)
    this.selectedPlayer = name
    this.displayMode = 'role'
    this._emitChange()
}

AppState.actions.deselectPlayer = function() {
    console.log('deselecting')
    this.selectedPlayer = null
    this.displayMode = 'list'
    this._emitChange()
}

AppState.actions.changeSettings = function(payload) {
    _.extend(this.settings, payload.settings)
    this._emitChange()
}
