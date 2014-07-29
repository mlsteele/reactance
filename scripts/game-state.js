var Store = require('./store')

module.exports = GameState

function GameState(dispatcher) {
    Store.mixin(this)

    this.playerNames = ['Miles', 'Jess', 'Brandon', 'Ciara', 'Chris']
    this.settings = {
        merlin: true,
        mordred: false,
        percival: false,
        morgana: false,
        oberon: false
    }
    this.roles = null
    // Reason that roles cannot be assigned.
    // One of: tooMany, tooFew
    this.disabledReason = null

    this.updateRoles()

    dispatcher.onAction(function(payload) {
        var actions = GameState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
            this.save()
        }
    }.bind(this))
}

var PERSIST_KEYS = ['playerNames', 'settings', 'roles', 'disabledReason']

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
    if (role.spy && !role.oberon) {
        role.otherSpies = _.without(this.getSpies(), name)
    }
    if (role.merlin) {
        role.spies = _.filter(this.getSpies(), (name) =>
            !this.roles[name].mordred);
    }
    if (role.percival) {
        role.merlins = this.getMerlins()
    }
    return role
}

GameState.prototype.getSpies = function() {
    return _.filter(this.playerNames, (name) =>
        this.roles[name].spy)
}

GameState.prototype.getMerlins = function() {
    return _.filter(this.playerNames, (name) =>
        this.roles[name].morgana || this.roles[name].merlin);
}

/**
 * Try to assign roles.
 * This should not be called if it's not possible.
 */
GameState.prototype.assignRoles = function() {
    // players    5 6 7 8 9 10
    // resistance 3 4 4 5 6 6
    // spy        2 2 3 3 3 4
    // var resistance = {5: 3, 6: 4, 7: 4, 8: 5, 9: 6, 10: 6,}

    var numPlayers = this.playerNames.length
    var numSpies = {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4,}[numPlayers]
    var shuffledNames = _.shuffle(this.playerNames)

    // Assign initial roles
    this.roles = {}
    shuffledNames.forEach((name, i) => {
        this.roles[name] = {
            spy: i < numSpies,
        }
    })

    // Keep track of players who haven't been assigned special roles
    var unassignedSpies = shuffledNames.slice(0, numSpies);
    var unassignedResistance = shuffledNames.slice(numSpies);

    if (this.settings.merlin) {
        var merlinName = unassignedResistance[0];
        unassignedResistance.splice(0,1);
        this.roles[merlinName].merlin = true;
    }
    if (this.settings.morgana) {
        var morganaName = unassignedSpies[0];
        unassignedSpies.splice(0,1);
        this.roles[morganaName].morgana = true;
    }
    if (this.settings.percival) {
        var percivalName = unassignedResistance[0];
        unassignedResistance.splice(0,1);
        this.roles[percivalName].percival = true;
    }
    if (this.settings.mordred) {
        var mordredName = unassignedSpies[0];
        unassignedSpies.splice(0,1);
        this.roles[mordredName].mordred = true;
    }
    if (this.settings.oberon) {
        var oberonName = unassignedSpies[0];
        unassignedSpies.splice(0,1);
        this.roles[oberonName].oberon = true;
    }

    this._emitChange()
}

/**
 * Make sure that roles exist if they can.
 * clear - whether to clear existing roles
 */
GameState.prototype.updateRoles = function(clear) {
    if (clear) {
        console.log('RECLEAR')
        this.roles = null
    }

    // Use existing roles if they still exist.
    if (this.roles !== null) return

    if (this.playerNames.length < 5) {
        this.disabledReason = 'tooFew'
    } else if (this.playerNames.length > 10) {
        this.disabledReason = 'tooMany'
    } else if (this.playerNames.length < 7 
            && this.settings.mordred 
            && this.settings.morgana 
            && this.settings.oberon) {
        this.disabledReason = 'tooFew'
    } else {
        this.disabledReason = null
        this.assignRoles()
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
