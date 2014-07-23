/** @jsx React.DOM */

var PT = React.PropTypes

var Settings = React.createClass({
    propTypes: {
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onChangeSettings: PT.func.isRequired,
    },

    render: function() {
        return <div onClick={this.onChangeMerlin}>
            <input
                type="checkbox"
                readOnly={true}
                checked={this.props.settings.merlin}>
                Merlin
            </input>
        </div>
    },

    onChangeMerlin: function() {
        this.props.onChangeSettings({
            merlin: !this.props.settings.merlin
        })
    },
});

module.exports = Settings
