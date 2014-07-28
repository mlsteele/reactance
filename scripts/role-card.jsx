/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var PT = React.PropTypes

var RoleCard = React.createClass({
    propTypes: {
        confirmed: PT.bool.isRequired,
        playerName: PT.string.isRequired,
        role: PT.object.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickCancel: PT.func.isRequired,
        onClickBack: PT.func.isRequired,
    },

    render: function() {
        if (this.props.confirmed) {
            return this.renderConfirmed()
        } else {
            return this.renderUncomfirmed()
        }
    },

    renderConfirmed: function() {
        var role = this.props.role
        var contents = null
        if (role.spy) {
            contents = <div>
                <p>You're a spy!</p>
                <p>The other spies are:</p>
                <PlayerList playerNames={this.props.role.otherSpies}/>
            </div>
        } else {
            contents = <p>You are a resistance member.</p>
        }
        if (role.merlin) {
            contents = <div>
                <p>You are the merlin.</p>
                <p>The spies are:</p>
                <PlayerList playerNames={this.props.role.spies}/>
            </div>
        }
        return <div className="role-card">
            {contents}
            <button
                onClick={this.onClickBack}>
                Back
            </button>
        </div>
    },

    renderUncomfirmed: function() {
        return <div className="role-card">
            <p>Are you {this.props.playerName}?</p>
            <button
                className="confirm"
                onClick={this.onClickConfirm}>
                Yes
            </button>
            <button
                className="cancel"
                onClick={this.onClickCancel}>
                No
            </button>
        </div>
    },

    onClickConfirm: function() {
        this.props.onClickConfirm(this.props.playerName)
    },

    onClickCancel: function() {
        this.props.onClickCancel()
    },

    onClickBack: function() {
        this.props.onClickBack()
    },
});

var If = React.createClass({
    propTypes: {
        cond: PT.bool.isRequired,
        a: PT.component.isRequired,
        b: PT.component.isRequired,
    },

    render: function() {
        if (this.props.cond) {
            return this.props.a
        } else {
            return this.props.b
        }
    },
})

module.exports = RoleCard
