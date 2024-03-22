require('resize-observer-polyfill');
// Mocking TextEncoder and TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
class ResizeObserver {
    constructor(callback) {}
    observe(target) {}
    unobserve(target) {}
    disconnect() {}
  }
  
  global.ResizeObserver = ResizeObserver;

