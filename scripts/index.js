var Tabs         = React.createFactory(require('./tabs.jsx'))
var SetupPage    = React.createFactory(require('./setup-page.jsx'))
var RolesPage    = React.createFactory(require('./roles-page.jsx'))
var MissionPage  = React.createFactory(require('./mission-page.jsx'))
var Dispatcher   = require('./dispatcher')
var UIState      = require('./ui-state')
var GameState    = require('./game-state')
var MissionState = require('./mission-state')
var store_reset  = require('./store-reset')

var dispatcher   = new Dispatcher()
var dispatch     = dispatcher.dispatch.bind(dispatcher)
var uistate      = new UIState(dispatcher)
var gamestate    = new GameState(dispatcher)
var missionstate = new MissionState(dispatcher)

// Increase this number after every datastore schema breaking change.
store_reset(3)
uistate.load()
gamestate.load()
missionstate.load()

var renderApp = function() {
    var setupPage = SetupPage({
        playerNames: gamestate.playerNames, settings: gamestate.settings,
        onAddName: dispatcher.bake('addPlayer', 'name'),
        onDeleteName: dispatcher.bake('deletePlayer', 'name'),
        onChangeSettings: dispatcher.bake('changeSettings', 'settings'),
        onNewRoles: dispatcher.bake('newRoles'),
    })

    var rolesPage = RolesPage({
        disabledReason: gamestate.disabledReason,
        playerNames: gamestate.playerNames,
        selectedPlayer: uistate.selectedPlayer,
        selectedRole:   gamestate.getRole(uistate.selectedPlayer),
        selectionConfirmed: uistate.selectionConfirmed,
        onClickShow:    dispatcher.bake('selectPlayer', 'name'),
        onClickConfirm: dispatcher.bake('confirmPlayer', 'name'),
        onClickCancel:  dispatcher.bake('deselectPlayer'),
        onClickOk:      dispatcher.bake('deselectPlayer', 'name'),
    })

    var missionPage = MissionPage({
        numPlayers: gamestate.playerNames.length,
        passes: missionstate.passes,
        fails: missionstate.fails,
        history: missionstate.history,
        revealed: uistate.missionRevealed,
        onVote: dispatcher.bake('missionVote', 'pass'),
        onReveal: dispatcher.bake('missionReveal'),
        onReset: dispatcher.bake('missionReset'),
    })

    React.render(
        Tabs({
            activeTab: uistate.tab,
            onChangeTab: dispatcher.bake('changeTab', 'tab'),
            tabs: {
                setup: {name: 'Setup', content: setupPage},
                roles: {name: 'Roles', content: rolesPage},
                mission: {name: 'Mission', content: missionPage},
            }
        }),
        document.getElementById('app')
    )
}

React.initializeTouchEvents(true)
renderApp()
uistate.onChange(renderApp)
gamestate.onChange(renderApp)
missionstate.onChange(renderApp)
