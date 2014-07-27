/** @jsx React.DOM */

var PT = React.PropTypes
var cx = React.addons.classSet

var Settings = React.createClass({
    propTypes: {
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onChangeSettings: PT.func.isRequired,
    },

    render: function() {
        return <div className="settings">
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.merlin,
                })}
                onClick={this.onChangeMerlin}>
                Merlin
            </button>
        </div>
    },

    onChangeMerlin: function() {
        this.props.onChangeSettings({
            merlin: !this.props.settings.merlin
        })
    },
});

module.exports = Settings
