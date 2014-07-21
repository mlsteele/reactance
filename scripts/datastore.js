var BackboneEvents = require("backbone-events-standalone");

module.exports = AppState

function AppState() {
    this.playerNames = []
    this.selectedPlayer = null
    this.displayMode = 'list'
}

AppState.prototype.addPlayer = function(name) {
    this.playerNames.push(name)
    this.trigger('change')
}

AppState.prototype.selectPlayer = function(name) {
    console.log('selecting', name)
    this.selectedPlayer = name
    this.displayMode = 'confirm'
    this.trigger('change')
}

AppState.prototype.confirmPlayer = function(name) {
    console.log('confirming', name)
    this.selectedPlayer = name
    this.displayMode = 'role'
    this.trigger('change')
}

AppState.prototype.deselectPlayer = function() {
    console.log('deselecting')
    this.selectedPlayer = null
    this.displayMode = 'list'
    this.trigger('change')
}

BackboneEvents.mixin(AppState.prototype)
