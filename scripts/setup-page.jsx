/** @jsx React.DOM */

var SetupPlayerList = require('./setup-player-list.jsx')
var Settings = require('./settings.jsx')
var RefLinks = require('./ref-links.jsx')
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
            <SetupPlayerList
                playerNames={this.props.playerNames}
                onAddName={this.props.onAddName}
                onDeleteName={this.props.onDeleteName} />
            <Settings
                settings={this.props.settings}
                onChangeSettings={this.props.onChangeSettings} />
            <button className="new-game"
                onClick={this.props.onNewRoles}>New Game</button>
            <RefLinks />
        </div>
    },
});

module.exports = SetupPage
