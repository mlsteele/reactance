/** @jsx React.DOM */

var Namelet = require('./namelet.jsx')
var PT = React.PropTypes

var PlayerChip = React.createClass({
    propTypes: {
        name: PT.string.isRequired,
    },

    render: function() {
        return <div className="player-chip">
            <Namelet name={this.props.name} />
            <span className="name">{this.props.name}</span>
        </div>
    },
});

module.exports = PlayerChip
