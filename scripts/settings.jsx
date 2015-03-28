/** @jsx React.DOM */

var PT = React.PropTypes
var cx = classnames

var Settings = React.createClass({
    propTypes: {
        // Mapping of settings to their values.
        settings: PT.object.isRequired,
        onChangeSettings: PT.func.isRequired,
    },

    render: function() {
        var settingOrder = ['morgana', 'mordred', 'oberon', 'merlin', 'percival']
        var items = settingOrder.map(function(setting) {
            return <li key={setting}><Toggle
                setting={setting}
                value={this.props.settings[setting]}
                onChange={this.onChangeSetting} /></li>
        }.bind(this))
        return <div className="settings">
            <h2>Special Roles</h2>
            <ul>{items}</ul>
        </div>
    },

    onChangeSetting: function(setting) {
        var changes = {}
        changes[setting] = !this.props.settings[setting]
        this.props.onChangeSettings(changes)
    },
});

var Toggle = React.createClass({
    propTypes: {
        setting: PT.string.isRequired,
        value: PT.bool.isRequired,
        onChange: PT.func.isRequired,
    },

    render: function() {
        return <button
            className={cx({
                'toggle': true,
                'active': this.props.value,
            })}
            onClick={this.onClick}>
            {capitalize(this.props.setting)}
        </button>
    },

    onClick: function() {
        this.props.onChange(this.props.setting)
    },
});

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = Settings
