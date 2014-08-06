/** @jsx React.DOM */

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
        this.setState({text: e.target.value})
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
