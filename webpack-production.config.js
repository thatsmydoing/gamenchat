var webpack = require('webpack');

module.exports = [
    require('./webpack-base.config.js')(true),
    {
        entry: './assets/server',
        output: {
            path: 'public',
            publicPath: '/assets/',
            filename: 'server.js'
        },
        resolve: {
            extensions: ['', '.js', '.jsx']
        },
        plugins: [
            new webpack.IgnorePlugin(/reqwest/),
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.DefinePlugin({
                "process.env": {
                    NODE_ENV: JSON.stringify("production")
                }
            })
        ],
        module: {
            loaders: [
                { test: /\.jsx$/, loader: 'jsx' }
            ]
        }
    }
]
