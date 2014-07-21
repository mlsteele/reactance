/** @jsx React.DOM */

var PT = React.PropTypes

module.exports = React.createClass({
    propTypes: {
        playerNames: PT.array.isRequired,
        onClickShow: PT.func.isRequired,
    },

    render: function() {
        var elements = this.props.playerNames.map(function(name) {
            var clickHandler = function() {
                return this.props.onClickShow(name)
            }.bind(this)
            return <li>
                <span>{name}</span>
                <button onClick={clickHandler}>Role</button>
            </li>
        }.bind(this))

        return <ul>{elements}</ul>
    },
});
