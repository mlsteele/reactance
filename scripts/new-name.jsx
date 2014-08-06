/** @jsx React.DOM */

var Namelet = require('./namelet.jsx')
var PT = React.PropTypes

var NewName = React.createClass({
    propTypes: {
        onAddName: PT.func,
    },

    getInitialState: function() {
        return {text: ''}
    },

    render: function() {
        return <form className="new-player" onSubmit={this.onSubmit}>
            <Namelet name={this.state.text} />
            <input type="name"
                className="name"
                value={this.state.text}
                placeholder="Another Player"
                autoCapitalize="on"
                onChange={this.onChange}
                ></input>
            <button className="new-player">
                Add</button>
        </form>
    },

    onChange: function(e) {
        var name = e.target.value
        name = name.charAt(0).toUpperCase() + name.slice(1),
        this.setState({text: name})
    },

    onSubmit: function(e) {
        e.preventDefault()
        if (this.state.text != "") {
            this.props.onAddName(this.state.text)
            this.setState({text: ""})
        }
    }
});

module.exports = NewName
