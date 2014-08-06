/** @jsx React.DOM */

var NewName = require('./new-name.jsx')
var PlayerChip = require('./player-chip.jsx')
var PT = React.PropTypes

var SetupPlayerList = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        onDeleteName: PT.func.isRequired,
        onAddName: PT.func.isRequired,
    },

    render: function() {
        var elements = this.props.playerNames.map(
            this.renderEntry)

        return <div><h2>Players</h2>
            <ul className="player-list">
                {elements}
                <li>
                    <NewName onAddName={this.props.onAddName} />
                </li>
            </ul>
        </div>
    },

    renderEntry: function(name) {
        var onClick = function() {
            this.props.onDeleteName(name);
        }.bind(this);

        return <li key={name}>
            <PlayerChip name={name} />
            <button className='delete'
                onClick={onClick}>
            </button>
        </li>
    },
});

module.exports = SetupPlayerList
