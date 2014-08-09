var Store = require('./store')

module.exports = UIState

function UIState(dispatcher) {
    Store.mixin(this)

    this.tab = 'setup'
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this.missionRevealed = false

    dispatcher.onAction(function(payload) {
        var actions = UIState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
            this.save()
        }
    }.bind(this))
}

var PERSIST_KEYS = ['tab', 'selectedPlayer', 'selectionConfirmed', 'missionRevealed']

UIState.prototype.save = function() {
    var persist = {}
    PERSIST_KEYS.forEach(key => persist[key] = this[key])
    store.set('store.uistate', persist)
}

UIState.prototype.load = function() {
    var persist = store.get('store.uistate')
    if (persist !== undefined) {
        PERSIST_KEYS.forEach(key => this[key] = persist[key])
    }
}


UIState.actions = {}

UIState.actions.changeTab = function({tab}) {
    this.tab = tab
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this.emitChange()
}

UIState.actions.selectPlayer = function({name}) {
    this.selectedPlayer = name
    this.selectionConfirmed = false
    this.emitChange()
}

UIState.actions.confirmPlayer = function({name}) {
    this.selectedPlayer = name
    this.selectionConfirmed = true
    this.emitChange()
}

UIState.actions.deselectPlayer = function() {
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this.emitChange()
}

UIState.actions.missionReveal = function() {
    this.missionRevealed = true
    this.emitChange()
}

UIState.actions.missionReset = function() {
    this.missionRevealed = false
    this.emitChange()
}

UIState.actions.newRoles = function() {
    this.tab = 'roles'
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this.emitChange()
}
