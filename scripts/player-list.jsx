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
            newname = <li><NewName
                onAddName={this.props.onAddName} /></li>
        }

        return <div><h2>Players</h2>
            <ul className="player-list">
                {elements}
                {newname}
            </ul>
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
            <div className="namelet">{name[0]}</div>
            <span className="name">{name}</span>
            {showButton}
            {deleteButton}
        </li>
    },
});

module.exports = PlayerList
