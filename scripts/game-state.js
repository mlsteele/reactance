var Store = require('./store')

module.exports = GameState

function GameState(dispatcher) {
    Store.mixin(this)

    this.playerNames = ['Miles', 'Jess', 'Brandon', 'Ciara', 'Chris']
    this.settings = {
        merlin: false,
    }
    this.roles = null
    this.updateRoles()

    dispatcher.onAction(function(payload) {
        var actions = GameState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
            this.save()
        }
    }.bind(this))
}

var PERSIST_KEYS = ['playerNames', 'settings', 'roles']

GameState.prototype.save = function() {
    var persist = {}
    PERSIST_KEYS.forEach(key => persist[key] = this[key])
    store.set('store.gamestate', persist)
}

GameState.prototype.load = function() {
    var persist = store.get('store.gamestate')
    if (persist !== undefined) {
        PERSIST_KEYS.forEach(key => this[key] = persist[key])
    }
    this.updateRoles()
}

/**
 * Get a role for a user.
 * Adds some extra useful info to the returned role.
 */
GameState.prototype.getRole = function(name) {
    if (this.roles === null) return null
    var role = _.extend({}, this.roles[name])
    if (role.spy) {
        role.otherSpies = _.without(this.getSpies(), name)
    }
    if (role.merlin) {
        role.spies = this.getSpies()
    }
    return role
}

GameState.prototype.getSpies = function() {
    return _.filter(this.playerNames, (name) =>
        this.roles[name].spy)
}

GameState.prototype.assignRoles = function() {
    // players    5 6 7 8 9 10
    // resistance 3 4 4 5 6 6
    // spy        2 2 3 3 3 4
    // var resistance = {5: 3, 6: 4, 7: 4, 8: 5, 9: 6, 10: 6,}

    var numPlayers = this.playerNames.length
    var numSpies = {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4,}[numPlayers]
    var names = _.shuffle(this.playerNames)

    // Assign initial roles
    this.roles = {}
    names.forEach((name, i) => {
        this.roles[name] = {
            spy: i < numSpies,
        }
    })

    if (this.settings.merlin) {
        var merlinName = this.playerNames[numSpies]
        this.roles[merlinName].merlin = true
    }

    this._emitChange()
}

/**
 * Make sure that roles exist
 * if they can.
 * clear - whether to clear existing roles
 */
GameState.prototype.updateRoles = function(clear) {
    if (clear) {
        console.log('RECLEAR')
        this.roles = null
    }
    if (this.roles === null) {
        if (this.playerNames.length >= 5 && this.playerNames.length <= 10) {
            this.assignRoles()
        }
    }
}

GameState.actions = {}

GameState.actions.addPlayer = function({name}) {
    if (!_.contains(this.playerNames, name)) {
        this.playerNames.push(name)
        this.updateRoles(true)
        this._emitChange()
    } else {
        console.log("ignoring duplicate name", name)
    }
}

GameState.actions.deletePlayer = function({name}) {
    this.playerNames = _.without(this.playerNames, name)
    this.updateRoles(true)
    this._emitChange()
}

GameState.actions.changeSettings = function({settings}) {
    _.extend(this.settings, settings)
    this.updateRoles(true)
    this._emitChange()
}

GameState.actions.newRoles = function() {
    this.updateRoles(true)
}
