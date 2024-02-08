/** @type {import("jest").config} */
const config  = {
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'jsdom',
    coverageThreshold: {
      global: {
        lines: 60,
      },
    },
    restoreMocks: true,
  };

  module.exports = config;
  