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

        var theSpies = role.spies || role.otherSpies || [];
        console.log(theSpies);
        var spiesText = theSpies.join(', ')
        var spyNoun = theSpies.length == 1 ? "spy" : "spies"
        var spyVerb = theSpies.length == 1 ? "is" : "are"
        var other = role.spy? "other" : ""
        var spiesBlock = <p>The {other} {spyNoun} {spyVerb}: <span className='spy'>{spiesText}</span></p>
        var extraInfo = <div></div>
        var description = <p></p>

        var name = <span className='resistance'>resistance</span>

        if (role.spy) {
            name = <span className='spy'>a spy</span>;
            extraInfo = spiesBlock;
        }
        if (role.percival) {
            name = <span className='resistance'>Percival</span>
            var theMerlins = role.merlins;
            var merlinsText = theMerlins.join(', ');
            var merlinNoun = theMerlins.length == 1 ? 'Merlin' : 'Merlins';
            var merlinVerb = theMerlins.length == 1 ? 'is' : 'are';
            var merlinsBlock = <p>The {merlinNoun} {merlinVerb}: {merlinsText}</p>
            extraInfo = merlinsBlock;
            description = <p>You see <span className='resistance'>Merlin</span> and <span className='spy'>Morgana</span> both as Merlin.</p>
        }
        if (role.merlin) {
            name = <span className='resistance'>Merlin</span>;
            extraInfo = spiesBlock;
            description = <p>If the spies discover your identity, resistance loses!</p>
        }
        if (role.mordred) { 
            name = <span className='spy'>Mordred</span>
            description = <p>You are invisible to <span className='resistance'>Merlin</span>.</p>
        }
        if (role.morgana) {
            name = <span className='spy'>Morgana</span>
            description = <p>You appear as <span className='resistance'>Merlin</span> to <span className='resistance'>Percival</span>.</p>
        }
        if (role.oberon) {
            name = <span className='spy'>Oberon</span>
            extraInfo = <div></div>
            description = <p>You can not see the other spies.</p>
        }
        contents = <div>
            <p>You are {name}!</p>
            {extraInfo}
            {description}
        </div>

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
