/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes
var PureRenderMixin = React.addons.PureRenderMixin

var RolesPage = React.createClass({
    mixins: [PureRenderMixin],

    propTypes: {
        disabledReason: PT.oneOf(['tooFew', 'tooMany']),
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
        if (this.props.disabledReason !== null) {
            var message = {
                tooFew: "Not enough players. :(",
                tooMany: "Too many players. :(",
            }[this.props.disabledReason]
            return <p>{message}</p>
        }

        // if (!this.props.rolesExist) {
            // return <p>Invalid setup. Go back to setup and change something.</p>
        // }

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
