import nextJest from 'next/jest.js';

// Uses the Next.js SWC compiler to transform TypeScript in tests,
// so no extra transformer (ts-jest/babel preset) is required.
const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts']
};

export default createJestConfig(config);
