/** @jsx React.DOM */

var colorStyleForPlayer = require('./color.js')
var PT = React.PropTypes
var cx = React.addons.classSet

var PlayerChip = React.createClass({
    propTypes: {
        name: PT.string.isRequired,
    },

    render: function() {
        return <div className="player-chip">
            {this.renderNamelet(this.props.name)}
            <span className="name">{this.props.name}</span>
        </div>
    },

    renderNamelet: function(name) {
        var styles = {'namelet': true}
        styles[colorStyleForPlayer(name)] = true
        return <div className={cx(styles)}>{name[0]}</div>
    },

});

module.exports = PlayerChip
