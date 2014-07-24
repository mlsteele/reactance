/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({
    propTypes: {
        rolesExist: PT.bool.isRequired,
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        selectedRole: PT.object,
        selectionConfirmed: PT.bool.isRequired,
        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickCancel: PT.func.isRequired,
        onClickOk: PT.func.isRequired,
    },

    render: function() {
        if (!this.props.rolesExist) {
            return <p>Invalid setup. Go back to setup.</p>
        }

        if (this.props.selectedPlayer) {
            return <RoleCard
                confirmed={this.props.selectionConfirmed}
                playerName={this.props.selectedPlayer}
                role={this.props.selectedRole}
                onClickConfirm={this.props.onClickConfirm}
                onClickCancel={this.props.onClickCancel}
                onClickBack={this.props.onClickCancel} />
        } else {
            return <PlayerList
                playerNames={this.props.playerNames}
                onClickShow={this.props.onClickShow} />
        }
    },
});

module.exports = RolesPage
