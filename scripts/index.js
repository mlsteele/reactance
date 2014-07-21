console.log('entry point');
var ReactanceApp = require('./reactance-app.jsx')

React.renderComponent(
    ReactanceApp(),
    document.getElementById('app')
);
