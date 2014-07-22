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

GameState.actions.addPlayer = function({name}) {
    if (!_.contains(this.playerNames, name)) {
        this.playerNames.push(name)
        this._emitChange()
    } else {
        console.log("ignoring duplicate name", name)
    }
}

GameState.actions.deletePlayer = function({name}) {
    this.playerNames = _.without(this.playerNames, name)
    this._emitChange()
}

GameState.actions.changeSettings = function({settings}) {
    _.extend(this.settings, settings)
    this._emitChange()
}
