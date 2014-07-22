/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        merlin: PT.bool.isRequired,
        onAddName: PT.func.isRequired,
        onDeleteName: PT.func.isRequired,
    },

    render: function() {
        return <div>
            <input
                type="checkbox"
                checked={this.props.merlin}
                onChange={this.onChangeMerlin} >
                Merlin
            </input>
        </div>
    },

    onChangeMerlin: function() {
        console.log(event.target.checked)
    },
});

module.exports = RolesPage
