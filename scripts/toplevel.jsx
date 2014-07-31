/** @jsx React.DOM */

var Tabs = require('./tabs.jsx')
var SetupPage = require('./setup-page.jsx')
var RolesPage = require('./roles-page.jsx')
var MissionPage = require('./mission-page.jsx')
var PT = React.PropTypes
var cx = React.addons.classSet

var TopLevel = React.createClass({
    propTypes: {
        dispatcher: PT.object.isRequired,
        uistate: PT.object.isRequired,
        gamestate: PT.object.isRequired,
        missionstate: PT.object.isRequired,
    },

    render: function() {
        var dispatcher = this.props.dispatcher
        var uistate = this.props.uistate
        var gamestate = this.props.gamestate
        var missionstate = this.props.missionstate

        var onAddName = function(name) {
            dispatch({
                action: 'addPlayer',
                name: name.charAt(0).toUpperCase() + name.slice(1),
            })
        }

        var setupPage = <SetupPage
            playerNames={gamestate.playerNames}
            settings={gamestate.settings}
            onAddName={onAddName}
            onDeleteName={dispatcher.bake('deletePlayer', 'name')}
            onChangeSettings={dispatcher.bake('changeSettings', 'settings')}
            onNewRoles={dispatcher.bake('newRoles')}
         />

        var rolesPage = <RolesPage
            disabledReason={gamestate.disabledReason}
            playerNames={gamestate.playerNames}
            selectedPlayer={uistate.selectedPlayer}
            selectedRole={  gamestate.getRole(uistate.selectedPlayer)}
            selectionConfirmed={uistate.selectionConfirmed}
            onClickShow={   dispatcher.bake('selectPlayer', 'name')}
            onClickConfirm={dispatcher.bake('confirmPlayer', 'name')}
            onClickCancel={ dispatcher.bake('deselectPlayer')}
            onClickOk={     dispatcher.bake('deselectPlayer', 'name')}
        />

        var missionPage = <MissionPage
            numPlayers={gamestate.playerNames.length}
            passes={missionstate.passes}
            fails={missionstate.fails}
            revealed={uistate.missionRevealed}
            onVote={  dispatcher.bake('missionVote', 'pass')}
            onReveal={dispatcher.bake('missionReveal')}
            onReset={ dispatcher.bake('missionReset')}
        />

        var tabs = {
            setup: {name: 'Setup', content: setupPage},
            roles: {name: 'Roles', content: rolesPage},
            mission: {name: 'Mission', content: missionPage},
        }

        return <Tabs
            activeTab={uistate.tab}
            onChangeTab={dispatcher.bake('changeTab', 'tab')}
            tabs={tabs}
        />
    },
});

module.exports = TopLevel
