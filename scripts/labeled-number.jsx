/** @jsx React.DOM */

var PT = React.PropTypes

var LabeledNumber = React.createClass({
    propTypes: {
        num: PT.number.isRequired,
        name: PT.string.isRequired,
    },

    render: function() {
        return <figure className="labeled-number">
            {this.props.num}
            <figcaption>{this.props.name}</figcaption>
        </figure>
    },
});

module.exports = LabeledNumber
