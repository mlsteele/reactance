var TopLevel = require('./toplevel.jsx')
var Dispatcher = require('./dispatcher')
var UIState = require('./ui-state')
var GameState = require('./game-state')
var MissionState = require('./mission-state')
var store_reset = require('./store-reset')

var dispatcher = new Dispatcher()
var dispatch = dispatcher.dispatch.bind(dispatcher)
var uistate = new UIState(dispatcher)
var gamestate = new GameState(dispatcher)
var missionstate = new MissionState(dispatcher)

// Increase this number after every datastore schema breaking change.
store_reset(2)
uistate.load()
gamestate.load()
missionstate.load()

var mainComponent = React.renderComponent(
    TopLevel({
        dispatcher: dispatcher,
        uistate: uistate,
        gamestate: gamestate,
        missionstate: missionstate,
    }), 
    document.getElementById('app'))

var refreshApp = function() {
    console.log('rerender')
    mainComponent.forceUpdate()
    // mainComponent.setProps()
}
uistate.onChange(refreshApp)
gamestate.onChange(refreshApp)
missionstate.onChange(refreshApp)
