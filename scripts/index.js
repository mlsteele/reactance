var ReactanceApp = require('./reactance-app.jsx')
var RolesPage = require('./roles-page.jsx')
var DataStore = require('./datastore.jsx')

var playerNames = []
playerNames.push('Miles')
playerNames.push('Jess')
playerNames.push('Brandon')
playerNames.push('Ciara')
playerNames.push('Chris')

var onClickShow = function(name) {
    console.log("click show", name)
}

var onClickConfirm = function(name) {
    console.log("click confirm", name)
}

React.renderComponent(
    RolesPage({
        mode: 'list',
        playerNames: playerNames,
        selectedPlayer: null,
        onClickShow: onClickShow,
    }),
    document.getElementById('app')
);
