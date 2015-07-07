var webpack = require('webpack');

module.exports = function(production) {
    var plugins = [];
    if(production) {
        plugins.push(
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.DefinePlugin({
                "process.env": {
                    NODE_ENV: JSON.stringify("production")
                }
            })
        );
    }
    return {
        entry: './assets/index',
        output: {
            path: 'public',
            publicPath: '/assets/',
            filename: 'bundle.js'
        },
        devtool: 'eval',
        plugins: plugins
    }
};

