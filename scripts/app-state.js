var Store = require('./store')

module.exports = AppState

function AppState() {
    Store.mixin(this)

    this.playerNames = []
    this.selectedPlayer = null
    this.displayMode = 'list'
    this.settings = {
        merlin: false,
    }
}

AppState.prototype.addPlayer = function(name) {
    this.playerNames.push(name)
    this._emitChange()
}

AppState.prototype.deletePlayer = function(name) {
    this.playerNames = _.without(this.playerNames, name)
    this._emitChange()
}

AppState.prototype.selectPlayer = function(name) {
    console.log('selecting', name)
    this.selectedPlayer = name
    this.displayMode = 'confirm'
    this._emitChange()
}

AppState.prototype.confirmPlayer = function(name) {
    console.log('confirming', name)
    this.selectedPlayer = name
    this.displayMode = 'role'
    this._emitChange()
}

AppState.prototype.deselectPlayer = function() {
    console.log('deselecting')
    this.selectedPlayer = null
    this.displayMode = 'list'
    this._emitChange()
}

AppState.prototype.changeSettings = function(settings) {
    _.extend(this.settings, settings)
    this._emitChange()
}
