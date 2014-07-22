var ReactanceApp = require('./reactance-app.jsx')
var RolesPage = require('./roles-page.jsx')
var SetupPage = require('./setup-page.jsx')
var AppState = require('./datastore')

var appstate = new AppState()
window.appstate = appstate

appstate.addPlayer('Miles')
appstate.addPlayer('Jess')
appstate.addPlayer('Brandon')
appstate.addPlayer('Ciara')
appstate.addPlayer('Chris')

var renderApp = function() {
    // React.renderComponent(
        // RolesPage({
            // mode: appstate.displayMode,
            // playerNames: appstate.playerNames,
            // selectedPlayer: appstate.selectedPlayer,
            // onClickShow: appstate.selectPlayer.bind(appstate),
            // onClickConfirm: appstate.confirmPlayer.bind(appstate),
            // onClickCancel: appstate.deselectPlayer.bind(appstate),
            // onClickOk: appstate.deselectPlayer.bind(appstate),
        // }),
        // document.getElementById('app')
    // );

    React.renderComponent(
        SetupPage({
            playerNames: appstate.playerNames,
            merlin: false,
            onAddName: appstate.addPlayer.bind(appstate),
            onDeleteName: appstate.deletePlayer.bind(appstate),
        }),
        document.getElementById('app')
    );
}

renderApp()
appstate.on('change', renderApp)
