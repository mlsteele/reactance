var Store = require('./store')

module.exports = UIState

function UIState(dispatcher) {
    Store.mixin(this)

    this.tab = 'setup'
    this.roleDisplayMode = 'list'
    this.selectedPlayer = null
    this.selectionConfirmed = false

    dispatcher.onAction(function(payload) {
        var actions = UIState.actions
        if (_.isFunction(actions[payload.action])) {
            actions[payload.action].call(this, payload)
        }
    }.bind(this))
}

UIState.actions = {}

UIState.actions.changeTab = function({tab}) {
    this.tab = tab
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this._emitChange()
}

UIState.actions.selectPlayer = function({name}) {
    console.log('selecting', name)
    this.selectedPlayer = name
    this.selectionConfirmed = false
    this._emitChange()
}

UIState.actions.confirmPlayer = function({name}) {
    console.log('confirming', name)
    this.selectedPlayer = name
    this.selectionConfirmed = true
    this._emitChange()
}

UIState.actions.deselectPlayer = function() {
    console.log('deselecting')
    this.selectedPlayer = null
    this.selectionConfirmed = false
    this._emitChange()
}
