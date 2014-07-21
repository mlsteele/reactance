/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var PT = React.PropTypes

module.exports = React.createClass({
    propTypes: {
        mode: PT.oneOf(['list', 'confirm', 'role']).isRequired,
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
    },

    render: function() {
        if (this.props.mode ==='list') {
            return <PlayerList
                playerNames={this.props.playerNames}
                onClickShow={this.props.onClickShow} />
        } else if (this.props.mode === 'confirm') {
        } else if (this.props.mode === 'role') {
        }
    },
});
