/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({
    propTypes: {
        mode: PT.oneOf(['list', 'confirm', 'role']).isRequired,
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickCancel: PT.func.isRequired,
        onClickOk: PT.func.isRequired,
    },

    render: function() {
        if (this.props.mode ==='list') {
            return <PlayerList
                playerNames={this.props.playerNames}
                onClickShow={this.props.onClickShow} />
        } else {
            return <RoleCard
                confirmed={this.props.mode === 'role'}
                playerName={this.props.selectedPlayer}
                onClickConfirm={this.props.onClickConfirm}
                onClickCancel={this.props.onClickCancel} />
        }
    },
});

module.exports = RolesPage
