/** @jsx React.DOM */

var PlayerList = require('./player-list.jsx')
var LabeledNumber = require('./labeled-number.jsx')
var PT = React.PropTypes
var cx = React.addons.classSet

var MissionPage = React.createClass({
    propTypes: {
        numPlayers: PT.number.isRequired,
        passes: PT.number.isRequired,
        fails:  PT.number.isRequired,
        history: PT.array.isRequired,
        revealed:  PT.bool.isRequired,
        onVote:  PT.func.isRequired,
        onReset:  PT.func.isRequired,
        onReveal:  PT.func.isRequired,
    },

    render: function() {
        var missionNumbers = this.renderMissionNumbers()
        if (this.props.revealed) {
            var passLabel = this.props.passes === 1 ? "Pass" : "Passes"
            var failLabel = this.props.fails === 1 ? "Fail" : "Fails"

            return <div className="mission-page revealed">
                {missionNumbers}
                <div className="vote-holder">
                    <LabeledNumber
                        name={passLabel}
                        num={this.props.passes} />
                    <LabeledNumber
                        name={failLabel}
                        num={this.props.fails} />
                </div>
                <button
                    className="reset"
                    onClick={this.props.onReset} >
                    Reset</button>
            </div>
        } else {
            var votes = this.props.passes + this.props.fails
            Math.random()
            var side = Math.random() > 0.5
            return <div className="mission-page">
                {missionNumbers}
                <LabeledNumber
                    name="Votes"
                    num={votes} />
                {this.renderVoteButton(side)}
                {this.renderVoteButton(!side)}
                <button
                    className="reset"
                    onClick={this.props.onReset} >
                    Reset</button>
                <div className="reveal-container">
                    <button className="reveal"
                        onClick={this.props.onReveal}>
                        Show Votes</button>
                </div>
            </div>
        }
    },

    renderMissionNumbers: function() {
        var missionNumbersGivenPlayers = {
            5: ["2", "3", "2", "3", "3"],
            6: ["2", "3", "4", "3", "4"],
            7: ["2", "3", "3", "4*", "4"],
            8: ["3", "4", "4", "5*", "5"],
            9: ["3", "4", "4", "5*", "5"],
            10: ["3", "4", "4", "5*", "5"],
        }
        var nums = missionNumbersGivenPlayers[this.props.numPlayers]
        var history = this.props.history
        var numElements = nums.map(function(num){
            return <span className="num">{num}</span>
        })
        for (var i=0; i<history.length; i++) {
            var passed = history[i]==0 || (history[i]==1 && nums[i].indexOf("*")!=-1)
            numElements[i] = <span className={cx({
                'pass': passed,
                'fail': !passed,
                'num': true
            })}>{nums[i]}</span>
        }

        if (nums !== undefined) {
            return <div className="mission-numbers">
                {numElements}
            </div>
        } else {
            return null
        }
    },

    renderVoteButton: function(pass) {
        var label = pass ? "Pass" : "Fail"
        return <div className="vote-container">
            <button
                className={cx({
                    'pass': pass,
                    'fail': !pass,
                    'secret-focus': true,
                })}
                data-pass={pass}
                onClick={this.onVote} >
                {label}</button>
        </div>
    },

    onVote: function(e) {
        var pass = e.target.dataset.pass === "true"
        this.props.onVote(pass)
    },
});

module.exports = MissionPage
