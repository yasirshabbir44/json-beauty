/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Polyfill for Node.js process object
(window as any).process = {
  env: { NODE_ENV: 'production' }
};

// Polyfill for Node.js modules (needed by xml2js)
(window as any).global = window;

// Create a comprehensive timers polyfill
const timers = {
  setImmediate: function(fn: Function) { return window.setTimeout(fn, 0); },
  clearImmediate: window.clearTimeout,
  setInterval: window.setInterval,
  clearInterval: window.clearInterval,
  setTimeout: window.setTimeout,
  clearTimeout: window.clearTimeout
};

// Add the timer functions directly to the global scope
(window as any).setImmediate = timers.setImmediate;
(window as any).clearImmediate = timers.clearImmediate;

// Webpack 5 no longer polyfills Node.js core modules automatically
// This is a workaround to make xml2js work in the browser
(window as any).Buffer = (window as any).Buffer || require('buffer').Buffer;

// Patch webpack's module system to provide the timers module
// This is needed because xml2js tries to require('timers')
const originalRequire = (window as any).require || (() => {});
(window as any).require = function(moduleName: string) {
  if (moduleName === 'timers') {
    return timers;
  }
  if (moduleName === 'stream') {
    return { Readable: class {}, Writable: class {}, Transform: class {} };
  }
  if (typeof originalRequire === 'function') {
    return originalRequire(moduleName);
  }
  throw new Error(`Module ${moduleName} not found`);
};