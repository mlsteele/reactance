/** @jsx React.DOM */

var PT = React.PropTypes

var RefLinks = React.createClass({
    render: function() {
        var rules_url = "http://www.boardgameguys.ie/sites/bggnew/files/The_Resistance_rules_english.pdf";
        var github_url = "https://github.com/mlsteele/reactance";
        var img_size = 32;

        return <section className="ref-links">
            <a href={github_url}>
                <img src="images/GitHub-Mark-64px.png" width={img_size} height={img_size} />
            </a>
            <a href={rules_url}>
                <img src="images/qmark.png" width={img_size} height={img_size} />
            </a>
            </section>
    },
});

module.exports = RefLinks