const webpack = require('webpack')
const isProd = process.env.NODE_ENV === 'production'
const assetsCDN = {
  // webpack build externals
  externals: {
    vue: 'Vue',
    'element-ui': 'ELEMENT',
    dayjs: 'dayjs'
  },
  css: [
    '//unpkg.com/element-ui/lib/theme-chalk/index.css'
  ],
  js: [
    '//cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js',
    '//cdn.jsdelivr.net/npm/dayjs@1.8.28/dayjs.min.js',
    '//unpkg.com/element-ui/lib/index.js'
  ]
}
module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/flappy-learning" : "/",
  outputDir: 'dist/flappy-learning',
  configureWebpack: {
    // webpack plugins
    plugins: [
      // Ignore all locale files of moment.js
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    // if prod, add externals
    externals: isProd ? assetsCDN.externals : {}
  },
  chainWebpack: config => {
    // if prod is on
    // assets require on cdn
    if (isProd) {
      config.plugin('html').tap(args => {
        args[0].cdn = assetsCDN
        return args
      })
    }
  },
  productionSourceMap: false
};