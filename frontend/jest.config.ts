import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: 'src',
  testMatch: ['**/tests/**/*.test.{ts,tsx}'],
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(png|jpg|svg)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/tests/**',
    '!main.tsx',
    '!**/datamocks/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
}

export default config
