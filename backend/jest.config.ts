import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/tests/**',
    '!server.ts',
    '!db/seeds/**',
    '!db/migrations/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
