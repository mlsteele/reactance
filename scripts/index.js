var Tabs = require('./tabs.jsx')
var SetupPage = require('./setup-page.jsx')
var RolesPage = require('./roles-page.jsx')
var MissionPage = require('./mission-page.jsx')
var Dispatcher = require('./dispatcher')
var UIState = require('./ui-state')
var GameState = require('./game-state')
var MissionState = require('./mission-state')

var dispatcher = new Dispatcher()
var dispatch = dispatcher.dispatch.bind(dispatcher)
var uistate = new UIState(dispatcher)
var gamestate = new GameState(dispatcher)
var missionstate = new MissionState(dispatcher)

uistate.load()
gamestate.load()
missionstate.load()

var onAddName = function(name) {
    dispatch({
        action: 'addPlayer',
        name: name.charAt(0).toUpperCase() + name.slice(1),
    })
}

var renderApp = function() {
    var setupPage = SetupPage({
        playerNames: gamestate.playerNames, settings: gamestate.settings,
        onAddName: onAddName,
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
        passes: missionstate.passes,
        fails: missionstate.fails,
        revealed: uistate.missionRevealed,
        onVote: dispatcher.bake('missionVote', 'pass'),
        onReveal: dispatcher.bake('missionReveal'),
        onReset: dispatcher.bake('missionReset'),
    })

    React.renderComponent(
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

renderApp()
uistate.onChange(renderApp)
gamestate.onChange(renderApp)
missionstate.onChange(renderApp)

// setTimeout(function() {
    // location.reload()
// }, 2000)
