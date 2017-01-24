const webpack = require('webpack');
const path = require('path');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
  entry: path.join(__dirname, 'src', 'client', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'app', 'server', 'static', 'js'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015']
        },
      },
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css?importLoaders=1!postcss') },
      // { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.(jpg|jpeg|gif|png|svg)$/, loader: 'url-loader?limit=8192&name=../img/[name].[ext]' } // inline base64 URLs for <=8k images, direct URLs for the rest
    ]
  },
  postcss: function() {
    return [
      autoprefixer({
        browsers: [
          '>1%',
          'last 4 versions',
          'Firefox ESR',
          'not ie < 9', // React doesn't support IE8 anyway
        ]
      }),
    ];
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      mangle: true,
      sourcemap: false,
      beautify: false,
      dead_code: true
    }),
    new ExtractTextPlugin('../css/[name].css'),
  ]
}
