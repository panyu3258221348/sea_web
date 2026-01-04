const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // Electron 打包需要使用相对路径
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/'
})
