var Store = require('./store')

module.exports = GameState

function GameState(dispatcher) {
    Store.mixin(this)

    this.playerNames = []
    this.settings = {
        merlin: false,
    }

    dispatcher.onAction(function(payload) {
        var actions = GameState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
        }
    }.bind(this))
}

GameState.actions = {}

GameState.actions.addPlayer = function(payload) {
    this.playerNames.push(payload.name)
    this._emitChange()
}

GameState.actions.deletePlayer = function(payload) {
    this.playerNames = _.without(this.playerNames, payload.name)
    this._emitChange()
}

GameState.actions.changeSettings = function(payload) {
    _.extend(this.settings, payload.settings)
    this._emitChange()
}
