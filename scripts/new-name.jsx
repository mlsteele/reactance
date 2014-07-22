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
        return <div>
            <input type="text"
                value={this.state.text}
                onChange={this.onChange}
                ></input>
            <button
                onClick={this.onClickAdd} >
                Add {this.state.text}</button>
        </div>
    },

    onChange: function(e) {
        this.setState({text: e.target.value})
    },

    onClickAdd: function() {
        this.props.onAddName(this.state.text)
        this.setState({text: ""})
    }
});

module.exports = NewName
