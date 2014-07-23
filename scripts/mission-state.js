var Store = require('./store')

module.exports = MissionState

function MissionState(dispatcher) {
    Store.mixin(this)

    this.playerNames = []
    this.settings = {
        merlin: false,
    }
    this.roles = null

    dispatcher.onAction(function(payload) {
        var actions = MissionState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
        }
    }.bind(this))
}

MissionState.prototype.getRole = function(name) {
    if (this.roles === null) return null
    return this.roles[name]
}

MissionState.prototype.getSpies = function() {
    return _.filter(this.playerNames, (name) =>
        this.roles[name].spy)
}

MissionState.prototype.assignRoles = function() {
    // players    5 6 7 8 9 10
    // resistance 3 4 4 5 6 6
    // spy        2 2 3 3 3 4
    // var resistance = {5: 3, 6: 4, 7: 4, 8: 5, 9: 6, 10: 6,}

    var numPlayers = this.playerNames.length
    var numSpies = {5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4,}[numPlayers]
    var names = _.shuffle(this.playerNames)
    var roles = {}
    names.forEach((name, i) => {
        roles[name] = {
            spy: i < numSpies,
        }
    })
    this.roles = roles
    this._emitChange()
}

MissionState.actions = {}

MissionState.actions.addPlayer = function({name}) {
    if (!_.contains(this.playerNames, name)) {
        this.playerNames.push(name)
        this._emitChange()
    } else {
        console.log("ignoring duplicate name", name)
    }
}

MissionState.actions.deletePlayer = function({name}) {
    this.playerNames = _.without(this.playerNames, name)
    this._emitChange()
}

MissionState.actions.changeSettings = function({settings}) {
    _.extend(this.settings, settings)
    this._emitChange()
}
