var ReactanceApp = require('./reactance-app.jsx')
var RolesPage = require('./roles-page.jsx')
var SetupPage = require('./setup-page.jsx')
var Dispatcher = require('./dispatcher')
var AppState = require('./app-state')

var dispatcher = new Dispatcher()
var dispatch = dispatcher.dispatch.bind(dispatcher)
var appstate = new AppState(dispatcher)

dispatch({action: 'addPlayer', name: 'Miles'})
dispatch({action: 'addPlayer', name: 'Jess'})
dispatch({action: 'addPlayer', name: 'Brandon'})
dispatch({action: 'addPlayer', name: 'Ciara'})
dispatch({action: 'addPlayer', name: 'Chris'})

var renderApp = function() {
    // React.renderComponent(
        // RolesPage({
            // mode: appstate.displayMode,
            // playerNames: appstate.playerNames,
            // selectedPlayer: appstate.selectedPlayer,
            // onClickShow:    dispatcher.bake('selectPlayer', 'name'),
            // onClickConfirm: dispatcher.bake('confirmPlayer', 'name'),
            // onClickCancel:  dispatcher.bake('deselectPlayer'),
            // onClickOk:      dispatcher.bake('deselectPlayer', 'name'),
        // }),
        // document.getElementById('app')
    // );

    React.renderComponent(
        SetupPage({
            playerNames: appstate.playerNames,
            settings: appstate.settings,
            onAddName: dispatcher.bake('addPlayer', 'name'),
            onDeleteName: dispatcher.bake('deletePlayer', 'name'), 
            onChangeSettings: dispatcher.bake('changeSettings', 'settings'),
        }),
        document.getElementById('app')
    );
}

renderApp()
appstate.onChange(renderApp)
