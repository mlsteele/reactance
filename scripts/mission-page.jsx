/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
// var VoteCard = require('./vote-card.jsx')
var PT = React.PropTypes

var MissionPage = React.createClass({
    propTypes: {
        passes: PT.number.isRequired,
        fails:  PT.number.isRequired,
    },

    render: function() {
        return <p>missions missions missions missions</p>
    },
});

module.exports = MissionPage
