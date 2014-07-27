/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var Settings = require('./settings.jsx')
var PT = React.PropTypes

var SetupPage = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onAddName: PT.func.isRequired,
        onDeleteName: PT.func.isRequired,
        onChangeSettings: PT.func.isRequired,
        onNewRoles: PT.func.isRequired,
    },

    render: function() {
        return <div>
            <PlayerList
                playerNames={this.props.playerNames}
                onAddName={this.props.onAddName}
                onDeleteName={this.props.onDeleteName} />
            <Settings
                settings={this.props.settings}
                onChangeSettings={this.props.onChangeSettings} />
            <button onClick={this.props.onNewRoles}>New Roles</button>
        </div>
    },
});

module.exports = SetupPage
