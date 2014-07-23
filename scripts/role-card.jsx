/** @jsx React.DOM */

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
        console.log(this.props.role.spy)
        return <div>
            <If cond={this.props.role.spy}
                a={<p>You're a spy!</p>}
                b={<p>You are a resistance member.</p>}
            />
            <button
                onClick={this.onClickBack}>
                Back
            </button>
        </div>
    },

    renderUncomfirmed: function() {
        return <div>
            <p>Are you {this.props.playerName}</p>
            <button
                onClick={this.onClickConfirm}>
                Yes
            </button>
            <button
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
