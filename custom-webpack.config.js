const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  resolve: {
    fallback: {
      timers: false,
      stream: false,
      buffer: require.resolve('buffer/')
    }
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg|json|woff2?)$/,
      threshold: 1024,
      minRatio: 0.8
    })
  ]
};
