module.exports = {
  resolve: {
    fallback: {
      "timers": false,
      "stream": false,
      "buffer": require.resolve("buffer/")
    }
  }
};