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
    var name = payload.name
    if (!_.contains(this.playerNames, name)) {
        this.playerNames.push(name)
        this._emitChange()
    } else {
        console.log("ignoring duplicate name", name)
    }
}

GameState.actions.deletePlayer = function(payload) {
    this.playerNames = _.without(this.playerNames, payload.name)
    this._emitChange()
}

GameState.actions.changeSettings = function(payload) {
    _.extend(this.settings, payload.settings)
    this._emitChange()
}
