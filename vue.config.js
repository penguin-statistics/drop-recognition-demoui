module.exports = {
  lintOnSave: false,

  publicPath: './',

  transpileDependencies: [
    'vuetify'
  ],

  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },

  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.jpg$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: false
              }
            }
          ]
        }
      ]
    }
  },

  chainWebpack (config) {
    config.module.rule('js').exclude.add(/\.worker\.js$/)

    config.module
      .rule('worker-loader')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
  }
}
