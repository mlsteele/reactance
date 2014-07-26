/** @jsx React.DOM */

var PT = React.PropTypes

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
            {this.props.tabs[this.props.activeTab]}
        </div>
    },

    renderButtons: function() {
        return _.map(this.props.tabs, function(val, name) {
            return <a 
                key={name}
                data-name={name}
                onClick={this.props.onChangeTab.bind(null, name)} >
                {name}</a>
        }.bind(this)) 
    },
});

module.exports = Tabs
