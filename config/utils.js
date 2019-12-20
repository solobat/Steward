const glob = require("glob")
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const pages = []
const entries = {}

glob.sync("./extension/pages/*/index.js").forEach(pagePath => {
  const chunk = pagePath.split('pages/')[1].split("/index.js")[0]

  entries[chunk] = pagePath
  pages.push(new HtmlWebpackPlugin({
    title: `Steward - ${chunk}`,
    template: `./extension/pages/${chunk}/${chunk}.html`,
    filename: `${chunk}.html`,
    inject: true,
    chunksSortMode: 'dependency',
    chunks: ['manifest', 'vendor', 'common', chunk]
  }))
})

module.exports = {
  pages,
  entries
}