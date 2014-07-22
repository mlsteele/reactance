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
        return <div>
            <input
                type="checkbox"
                checked={this.props.settings.merlin}
                onChange={this.onChangeMerlin} >
                Merlin
            </input>
        </div>
    },

    onChangeMerlin: function() {
        this.props.onChangeSettings({
            merlin: event.target.checked,
        })
    },
});

module.exports = RolesPage
