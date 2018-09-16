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
const VueLoaderPlugin = require('vue-loader/lib/plugin')

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
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
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
  plugins: [
    new webpack.DefinePlugin({
      EXT_TYPE: JSON.stringify("steward")
    }),
    new VueLoaderPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    //Generate an HTML5 file that includes all webpack bundles(includes css & js) in the body using script tags
    new HtmlWebpackPlugin({
      title: 'Steward - Content',
      template: './extension/pages/content/content.html',
      filename: 'content.html',
      chunks: ['manifest', 'vendor', 'content']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Extension',
      template: './extension/pages/steward/steward.html',
      filename: 'steward.html',
      chunks: ['manifest', 'vendor', 'steward']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Background',
      template: './extension/pages/background/background.html',
      filename: 'background.html',
      chunks: ['manifest', 'vendor', 'background']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Popup',
      template: './extension/pages/popup/popup.html',
      filename: 'popup.html',
      chunks: ['manifest', 'vendor', 'popup']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Options',
      template: './extension/pages/options/options.html',
      filename: 'options.html',
      chunks: ['manifest', 'vendor', 'options']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - Login',
      template: './extension/pages/login/login.html',
      filename: 'login.html',
      chunks: ['manifest', 'vendor', 'login']
    }),
    new HtmlWebpackPlugin({
      title: 'Steward - URLBlock',
      template: './extension/pages/urlblock/urlblock.html',
      filename: 'urlblock.html',
      chunks: ['manifest', 'vendor', 'urlblock']
    }),
    //Create our CSS bundles by our entry points names (Ex: popup.css, options.css)
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new CopyWebpackPlugin([
      {from: 'extension/img', to: 'img'},
      {from: 'extension/svg', to: 'iconfont'},
      {from: 'extension/css', to: 'css'},
      {from: 'extension/scripts', to: 'scripts'},
      {from: 'extension/_locales', to: '_locales'},
      {from: 'extension/manifest.json'}
    ]),
    // split vendor js into its own file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks (module) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),
    // This instance extracts shared chunks from code splitted chunks and bundles them
    // in a separate chunk, similar to the vendor chunk
    // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
    new webpack.optimize.CommonsChunkPlugin({
      name: 'app',
      async: 'vendor-async',
      children: true,
      minChunks: 3
    }),
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
