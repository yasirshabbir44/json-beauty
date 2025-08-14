const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // Use our custom xml2js shim instead of the Node.js module
      'xml2js': path.resolve(__dirname, 'src/app/shims/xml2js.js')
    },
    fallback: {
      // Provide empty implementations for Node.js modules
      "timers": false,
      "stream": false
    }
  }
};