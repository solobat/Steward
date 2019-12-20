const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default
const cssNano = require('cssnano')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production'
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const conf = require('./utils')

const config = {
  mode: process.env.NODE_ENV,
  entry: conf.entries,
  output: {
    path: path.resolve(__dirname, '../output/steward/'),
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
        test: /\.vue$/,
        loader: 'vue-loader'
      },
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
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.(eot|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader?name=[name].[ext]&outputPath=./&publicPath=./'
      },
      {
        test: /\.(svg)(\?\S*)?$/,
        loader: 'file-loader?name=[name].[ext]&outputPath=iconfont/&publicPath=./'
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: [
          'file-loader?name=[name].[ext]&outputPath=img/&publicPath=./'
        ]
      }
    ]
  },
  optimization: {
    runtimeChunk: {
      name: 'manifest'
    },
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      minChunks: 3,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: true,
      cacheGroups: {
        vendor: {
          name: 'vendor',
          priority: -10,
          reuseExistingChunk: true,
          test: /\/node_modules\//
        },
        common: {
          name: 'common',
          priority: 0,
          reuseExistingChunk: true,
          test: /\/(components|extension\/js)\//
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      EXT_TYPE: JSON.stringify("steward"),
      PLATFORM: JSON.stringify("chrome")
    }),
    new VueLoaderPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new MonacoEditorPlugin({
      languages: ['javascript', 'json']
    }),
    //Generate an HTML5 file that includes all webpack bundles(includes css & js) in the body using script tags
    ...conf.pages,
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new CopyWebpackPlugin([
      {from: 'extension/img', to: 'img'},
      {from: 'extension/svg', to: 'iconfont'},
      {from: 'extension/css', to: 'css'},
      {from: 'extension/scripts', to: 'scripts'},
      {from: 'extension/_locales', to: '_locales'},
      {from: 'extension/manifest.json', to: 'manifest.json'}
    ]),
    new ImageminPlugin({test: /\.(jpe?g|png|gif|svg)$/i})
  ]
}

if(isProduction) {
  config.plugins.push(
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/,
      cssProcessor: cssNano,
      cssProcessorOptions: {discardComments: {removeAll: true}, safe: true}, canPrint: true
    })
  )
}

module.exports = config
