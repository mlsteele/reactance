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
            <h2>Special Roles</h2>
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.merlin,
                })}
                onClick={this.onChangeMerlin}>
                Merlin
            </button>
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.morgana,
                })}
                onClick={this.onChangeMorgana}>
                Morgana
            </button>
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.mordred,
                })}
                onClick={this.onChangeMordred}>
                Mordred
            </button>
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.percival,
                })}
                onClick={this.onChangePercival}>
                Percival
            </button>
            <button
                className={cx({
                    'toggle': true,
                    'active': this.props.settings.oberon,
                })}
                onClick={this.onChangeOberon}>
                Oberon
            </button>
        </div>
    },

    onChangeMerlin: function() {
        this.props.onChangeSettings({
            merlin: !this.props.settings.merlin
        })
    },

    onChangeMorgana: function() {
        this.props.onChangeSettings({
            morgana: !this.props.settings.morgana
        })
    },

    onChangeMordred: function() {
        this.props.onChangeSettings({
            mordred: !this.props.settings.mordred
        })
    },

    onChangePercival: function() {
        this.props.onChangeSettings({
            percival: !this.props.settings.percival
        })
    },

    onChangeOberon: function() {
        this.props.onChangeSettings({
            oberon: !this.props.settings.oberon
        })
    },
});

module.exports = Settings
