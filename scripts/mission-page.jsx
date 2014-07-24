/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
// var VoteCard = require('./vote-card.jsx')
var PT = React.PropTypes

var MissionPage = React.createClass({
    propTypes: {
        passes: PT.number.isRequired,
        fails:  PT.number.isRequired,
        onVote:  PT.func.isRequired,
        onReset:  PT.func.isRequired,
    },

    render: function() {
        return <div>
            <p>passes: {this.props.passes}</p>
            <p>fails: {this.props.fails}</p>
            <button
                data-pass="pass"
                onClick={this.onVote} >
                pass</button>
            <button
                data-pass="fail"
                onClick={this.onVote} >
                fail</button>
            <button
                onClick={this.props.onReset} >
                reset</button>
        </div>
    },

    onVote: function(e) {
        this.props.onVote(
            e.target.dataset.pass === "pass")
    },
});

module.exports = MissionPage
