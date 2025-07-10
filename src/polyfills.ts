/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Polyfill for Node.js process object
(window as any).process = {
  env: { NODE_ENV: 'production' }
};