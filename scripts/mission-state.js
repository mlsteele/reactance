var Store = require('./store')

module.exports = MissionState

function MissionState(dispatcher) {
    Store.mixin(this)

    this.passes = 0
    this.fails = 0
    this.history = []

    dispatcher.onAction(function(payload) {
        var actions = MissionState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
            this.save()
        }
    }.bind(this))
}

var PERSIST_KEYS = ['passes', 'fails', 'history']

MissionState.prototype.save = function() {
    var persist = {}
    PERSIST_KEYS.forEach(key => persist[key] = this[key])
    store.set('store.missionstate', persist)
}

MissionState.prototype.load = function() {
    var persist = store.get('store.missionstate')
    if (persist !== undefined) {
        PERSIST_KEYS.forEach(key => this[key] = persist[key])
    }
}

MissionState.prototype.resetMission = function() {
    this.passes = 0
    this.fails = 0
    this._emitChange()
}

MissionState.prototype.resetMissionHistory = function() {
    this.history = []
    this.resetMission()
}

MissionState.actions = {}

MissionState.actions.missionVote = function({pass}) {
    if (pass) {
        this.passes += 1
    } else {
        this.fails += 1
    }
    this._emitChange()
}

MissionState.actions.missionReset = function() {
    this.resetMission()
}

MissionState.actions.addPlayer = function({name}) {
    this.resetMissionHistory()
}

MissionState.actions.deletePlayer = function({name}) {
    this.resetMissionHistory()
}

MissionState.actions.changeSettings = function({settings}) {
    this.resetMissionHistory()
}

MissionState.actions.newRoles = function() {
    this.resetMissionHistory()
}

MissionState.actions.missionReveal = function() {
    this.history.push(this.fails)
}
