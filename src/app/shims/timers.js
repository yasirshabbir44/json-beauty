// Shim for Node.js timers module
module.exports = {
  setImmediate: function(fn) { return setTimeout(fn, 0); },
  clearImmediate: function(id) { clearTimeout(id); },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};