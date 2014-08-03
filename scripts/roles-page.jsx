/** @jsx React.DOM */

var RolePlayerEntry = require('./role-player-entry.jsx')
var RoleCard = require('./role-card.jsx')
var PT = React.PropTypes

var RolesPage = React.createClass({
    propTypes: {
        disabledReason: PT.oneOf(['tooFew', 'tooMany']),
        playerNames: PT.array.isRequired,
        selectedPlayer: PT.string,
        selectedRole: PT.object,
        selectionConfirmed: PT.bool.isRequired,
        onClickShow: PT.func.isRequired,
        onClickConfirm: PT.func.isRequired,
        onClickCancel: PT.func.isRequired,
        onClickOk: PT.func.isRequired,
    },

    render: function() {
        if (this.props.disabledReason !== null) {
            var message = {
                tooFew: "Not enough players. :(",
                tooMany: "Too many players. :(",
            }[this.props.disabledReason]
            return <p>{message}</p>
        }

        // if (!this.props.rolesExist) {
            // return <p>Invalid setup. Go back to setup and change something.</p>
        // }

        var elements = this.props.playerNames.map(function(name) {
            return this.renderEntry(
                name,
                this.props.selectedPlayer === name,
                this.props.selectionConfirmed)
        }.bind(this))

        return <ul className="player-list">
            {elements}
        </ul>

    },

    renderEntry: function(name, selected, confirmed) {

        var content = null;
        if (selected && confirmed) {
            content = <RoleCard
                playerName={this.props.selectedPlayer}
                role={this.props.selectedRole} />
        }

        return <RolePlayerEntry
            name={name}
            content={content}
            selected={selected}
            confirmed={selected && confirmed}

            onClickShow={this.props.onClickShow}
            onClickConfirm={this.props.onClickConfirm}
            onClickBack={this.props.onClickCancel} />

    },
});

module.exports = RolesPage
