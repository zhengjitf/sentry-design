const path = require('path');

// https://jestjs.io/docs/en/configuration
module.exports = {
  preset: 'ts-jest', // https://kulshekhar.github.io/ts-jest/docs/presets
  // NOTE: Use `@jest-environment jsdom` docblock at the top of the file to override for `jsdom` environments.
  testEnvironment: 'node',
  rootDir: process.cwd(),
  globals: {
    'ts-jest': {
      tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
    },
  },
  // verbose: true, // output the result of all individual tests
  // collectCoverage: true, // gather code coverage for codecov
};
