/** @jsx React.DOM */

var PT = React.PropTypes
var cx = React.addons.classSet

var Tabs = React.createClass({
    propTypes: {
        activeTab: PT.string.isRequired,
        onChangeTab: PT.func.isRequired,
        tabs: PT.object.isRequired,
    },

    render: function() {
        return <div>
            <nav>
            {this.renderButtons()}
            </nav>
            <div className="tab-contents">
            {this.props.tabs[this.props.activeTab].content}
            </div>
        </div>
    },

    renderButtons: function() {
        return _.map(this.props.tabs, function(val, name) {
            return <a 
                className={cx({
                    'active': this.props.activeTab === name,
                })}
                key={name}
                data-name={name}
                onClick={this.props.onChangeTab.bind(null, name)} >
                {val.name}</a>
        }.bind(this)) 
    },
});

module.exports = Tabs
