/** @jsx React.DOM */

var PT = React.PropTypes

var PlayerList = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        onClickShow: PT.func,
        onDeleteName: PT.func,
    },

    render: function() {
        var elements = this.props.playerNames.map(
            this.renderName.bind(this))

        return <ul>{elements}</ul>
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

        return <li>
            <span>{name}</span>
            {showButton}
            {deleteButton}
        </li>
    }
});

module.exports = PlayerList
