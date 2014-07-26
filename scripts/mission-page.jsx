/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var PT = React.PropTypes
var cx = React.addons.classSet

var MissionPage = React.createClass({
    propTypes: {
        passes: PT.number.isRequired,
        fails:  PT.number.isRequired,
        revealed:  PT.bool.isRequired,
        onVote:  PT.func.isRequired,
        onReset:  PT.func.isRequired,
        onReveal:  PT.func.isRequired,
    },

    render: function() {
        if (this.props.revealed) {
            return <div className="mission-page">
                <p>Passes: {this.props.passes}</p>
                <p>Fails: {this.props.fails}</p>
                <button onClick={this.props.onReset}>Reset</button>
            </div>
        } else {
            var votes = this.props.passes + this.props.fails
            return <div className="mission-page">
                <p>Votes: {votes}</p>
                <button
                    className={cx({
                        'pass': true,
                        'secret-focus': true,
                    })}
                    data-pass="pass"
                    onClick={this.onVote} >
                    Pass</button>
                <button
                    className={cx({
                        'fail': true,
                        'secret-focus': true,
                    })}
                    data-pass="fail"
                    onClick={this.onVote} >
                    Fail</button>
                <button onClick={this.props.onReset}>Reset</button>
                <button onClick={this.props.onReveal}>Reveal</button>
            </div>
        }
    },

    onVote: function(e) {
        var pass = e.target.dataset.pass === 'pass'
        this.props.onVote(pass)
    },
});

module.exports = MissionPage
