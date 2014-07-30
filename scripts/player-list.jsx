/** @jsx React.DOM */

var NewName = require('./new-name.jsx')
var colorForPlayer = require('./color.js')
var PT = React.PropTypes
var PureRenderMixin = React.addons.PureRenderMixin

var PlayerList = React.createClass({
    mixins: [PureRenderMixin],

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
        var style = {'background-color': colorForPlayer(name)}

        return <li key={name}>
            <div className="namelet" style={style}>{name[0]}</div>
            <span className="name">{name}</span>
            {showButton}
            {deleteButton}
        </li>
    },
});

module.exports = PlayerList
