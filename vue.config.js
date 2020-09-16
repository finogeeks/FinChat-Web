// vue.config.js
const path = require('path');

console.log('==================process.env.NODE_ENV==================');
console.log(process.env.NODE_ENV);
const target = 'https://api.finogeeks.club';
// const target = 'https://finchat-dev.finogeeks.club';
// const target = 'http://fino.qhee.com.cn';
// const target = 'https://testimchat.gf.com.cn';

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.join(__dirname, './src'),
      },
    },
    devServer: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          ws: true,
        },
        '/_matrix': {
          target,
          changeOrigin: true,
          ws: true,
        },
        '/auth': {
          target: 'https://iam3.finogeeks.club:7777',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  },
  publicPath: process.env.NODE_ENV === 'production'
    ? './'
    : '/',
  productionSourceMap: false,
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
};
