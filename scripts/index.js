var Tabs = require('./tabs.jsx')
var RolesPage = require('./roles-page.jsx')
var SetupPage = require('./setup-page.jsx')
var Dispatcher = require('./dispatcher')
var GameState = require('./game-state')
var UIState = require('./ui-state')

var dispatcher = new Dispatcher()
var dispatch = dispatcher.dispatch.bind(dispatcher)
var uistate = new UIState(dispatcher)
var gamestate = new GameState(dispatcher)

dispatch({action: 'addPlayer', name: 'Miles'})
dispatch({action: 'addPlayer', name: 'Jess'})
dispatch({action: 'addPlayer', name: 'Brandon'})
dispatch({action: 'addPlayer', name: 'Ciara'})
dispatch({action: 'addPlayer', name: 'Chris'})

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
    })

    var rolesPage = RolesPage({
        mode: uistate.roleDisplayMode,
        playerNames: gamestate.playerNames,
        selectedPlayer: uistate.selectedPlayer,
        selectedRole:   gamestate.getRole(uistate.selectedPlayer),
        onClickShow:    dispatcher.bake('selectPlayer', 'name'),
        onClickConfirm: dispatcher.bake('confirmPlayer', 'name'),
        onClickCancel:  dispatcher.bake('deselectPlayer'),
        onClickOk:      dispatcher.bake('deselectPlayer', 'name'),
    })

    React.renderComponent(
        Tabs({
            activeTab: uistate.tab,
            onChangeTab: dispatcher.bake('changeTab', 'tab'),
            tabs: {
                setup: setupPage,
                roles: rolesPage,
            }
        }),
        document.getElementById('app')
    )
}

renderApp()
uistate.onChange(renderApp)
gamestate.onChange(renderApp)
