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
            <nav><ul>
            {this.renderButtons()}
            </ul></nav>
            {this.props.tabs[this.props.activeTab]}
        </div>
    },

    renderButtons: function() {
        return _.map(this.props.tabs, function(val, name) {
            return <li 
                key={name}
                data-name={name}
                onClick={this.props.onChangeTab.bind(null, name)} >
                {name}</li>
        }.bind(this)) 
    },

    onClickTab: function(name) {
        console.log(name)
        // onChangeTab
    },
});

module.exports = Tabs
