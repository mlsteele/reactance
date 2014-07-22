/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onAddName: PT.func.isRequired,
        onDeleteName: PT.func.isRequired,
        onChangeSettings: PT.func.isRequired,
    },

    render: function() {
        return <div onClick={this.onChangeMerlin}>
            <input
                type="checkbox"
                readOnly={true}
                checked={this.props.settings.merlin}>
                Merlin
            </input>
        </div>
    },

    onChangeMerlin: function() {
        this.props.onChangeSettings({
            merlin: !this.props.settings.merlin
        })
    },
});

module.exports = RolesPage
