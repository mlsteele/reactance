/** @jsx React.DOM */

var PlayerChip = require('./player-chip.jsx')
var PT = React.PropTypes

var RolePlayerEntry = React.createClass({
    propTypes: {
        name: PT.string.isRequired,
        confirmed: PT.bool.isRequired,
        selected: PT.bool.isRequired,
        content: PT.component,

        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickBack: PT.func.isRequired,
    },

    render: function() {
        return <li key={this.props.name}>
            <PlayerChip name={this.props.name} />
            {this.renderButton()}
            {this.props.content}
        </li>
    },

    renderButton: function() {

        var clickHandler = function() {
            console.log("click Show");
            this.props.onClickShow(this.props.name)
        }.bind(this);
        var text = "Show role";

        if(this.props.confirmed) {
            clickHandler = function() {
            console.log("click Back");
                this.props.onClickBack()
            }.bind(this);
            text = "Hide";
        }
        else if (this.props.selected) {
            clickHandler = function() {
            console.log("click Confirm");
                this.props.onClickConfirm(this.props.name)
            }.bind(this);
            text = "Are you " + this.props.name + "?";
        }

        return <button onClick={clickHandler}>{text}</button>
    }

});

module.exports = RolePlayerEntry
