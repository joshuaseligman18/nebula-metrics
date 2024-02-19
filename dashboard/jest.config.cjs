/** @type {import("jest").Config} */
module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
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
};
