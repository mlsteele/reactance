/** @jsx React.DOM */

var colorStyleForPlayer = require('./color.js')
var PT = React.PropTypes
var cx = React.addons.classSet

var Namelet = React.createClass({
    propTypes: {
        name: PT.string.isRequired,
    },

    render: function() {
        var name = this.props.name
        var styles = {'namelet': true}
        if (this.props.name !== "") {
            styles[colorStyleForPlayer(name)] = true
        }
        return <div className={cx(styles)}>{name[0]}</div>
    },

});

module.exports = Namelet
