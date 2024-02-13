/** @type {import("jest").Config} */
const { defaults: tsjPreset } = require('ts-jest/presets');
const esModules = ['d3', 'd3-array'].join('|');

module.exports = {
  transform: {
    ...tsjPreset.transform,
    '^.+\\.jsx?$': 'babel-jest', // Add babel-jest for handling ECMAScript Modules
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'], 
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
  restoreMocks: true,
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
};