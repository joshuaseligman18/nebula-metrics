const { createTransformer } = require('ts-jest');

module.exports = createTransformer({
  process() {
    return 'module.exports = {};';
  },
});
