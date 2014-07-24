/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
// var VoteCard = require('./vote-card.jsx')
var PT = React.PropTypes

var MissionPage = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        onClickVote: PT.func.isRequired,
        onVote: PT.func.isRequired,
    },

    render: function() {
        if (this.props.selectedPlayer) {
            return VoteCard
        } else {
            return <PlayerList
                playerNames={this.props.playerNames}
                onClickVote={this.props.onClickVote} />
        }
    },
});

module.exports = MissionPage
