/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "\\.(css|scss)$": "jest-transform-stub",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: ["/node_modules/(?!ag-grid-community)", "!/node_modules/ag-grid-community/styles/"],
  moduleNameMapper: {
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/__ mocks __/fileMock.js",
  },
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
  restoreMocks: true,
};
