/**
 * Jest Configuration
 * Configures the test environment for unit testing
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module name mapper for handling static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Transform files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
