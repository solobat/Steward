const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const webpack = require('webpack')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default
const cssNano = require('cssnano')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production'

const config = {
  entry: {
    content: './extension/pages/content/content.js',
    steward: './extension/pages/steward/steward.js',
    popup: './extension/pages/popup/popup.js',
    options: './extension/pages/options/options.js',
    background: './extension/pages/background/background.js',
    login: './extension/pages/login/login.js',
    urlblock: './extension/pages/urlblock/urlblock.js'
  },
  output: {
    path: path.resolve(__dirname, '../output/alfred/'),
    filename: '[name].js'
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: [
          'file-loader?name=[name].[ext]&outputPath=img/&publicPath=./'
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      EXT_TYPE: JSON.stringify("alfred")
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
    //Generate an HTML5 file that includes all webpack bundles(includes css & js) in the body using script tags
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - Content',
      template: './extension/pages/content/content.html',
      filename: 'content.html',
      chunks: ['content']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Extension',
      template: './extension/pages/steward/steward.html',
      filename: 'steward.html',
      chunks: ['steward']
    }),
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - Background',
      template: './extension/pages/background/background.html',
      filename: 'background.html',
      chunks: ['background']
    }),
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - Popup',
      template: './extension/pages/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - Options',
      template: './extension/pages/options/options.html',
      filename: 'options.html',
      chunks: ['options']
    }),
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - Login',
      template: './extension/pages/login/login.html',
      filename: 'login.html',
      chunks: ['login']
    }),
    new HtmlWebpackPlugin({
      title: 'Browser Alfred - URLBlock',
      template: './extension/pages/urlblock/urlblock.html',
      filename: 'urlblock.html',
      chunks: ['urlblock']
    }),
    //Create our CSS bundles by our entry points names (Ex: popup.css, options.css)
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new CopyWebpackPlugin([
      {from: 'extension/img', to: 'img'},
      {from: 'extension/css', to: 'css'},
      {from: 'extension/scripts', to: 'scripts'},
      {from: 'extension/_locales', to: '_locales'},
      {from: 'extension/manifest-alfred.json', to: 'manifest.json'}
    ]),
    new ImageminPlugin({test: /\.(jpe?g|png|gif|svg)$/i})
  ]
}

if(isProduction) {
  config.plugins.push(
    new UglifyJSPlugin({
      sourceMap: false,
      uglifyOptions: {
        mangle: true,
        compress: {
          dead_code: true,
          drop_console: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true
        }
      }
    }),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/,
      cssProcessor: cssNano,
      cssProcessorOptions: {discardComments: {removeAll: true}, safe: true}, canPrint: true
    })
  )
}

module.exports = config
