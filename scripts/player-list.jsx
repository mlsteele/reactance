/** @jsx React.DOM */

var NewName = require('./new-name.jsx')
var PT = React.PropTypes

var PlayerList = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        onClickShow: PT.func,
        onDeleteName: PT.func,
        onAddName: PT.func,
    },

    render: function() {
        var elements = this.props.playerNames.map(
            this.renderName)

        var newname = null
        if (this.props.onAddName) {
            newname = <NewName
                onAddName={this.props.onAddName} />
        }

        return <div><h2>Players</h2>
            <ul className="player-list">{elements}</ul>
            {newname}
        </div>
    },

    renderName: function(name) {
        var showButton = null
        var deleteButton = null

        if (this.props.onClickShow) {
            var clickHandler = function() {
                this.props.onClickShow(name)
            }.bind(this)
            showButton = <button 
                onClick={clickHandler}>
                Role</button>
        }

        if (this.props.onDeleteName) {
            var clickHandler = function() {
                this.props.onDeleteName(name)
            }.bind(this)
            deleteButton = <button 
                onClick={clickHandler}>
                Delete</button>
        }

        return <li key={name}>
            <span>{name}</span>
            {showButton}
            {deleteButton}
        </li>
    },
});

module.exports = PlayerList
