const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Chemin vers l'application Next.js
  dir: './',
});

const customJestConfig = {
  // Ajouter plus de configurations de setup avant chaque test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Environnement de test
  testEnvironment: 'jest-environment-jsdom',
  
  // Patterns des fichiers de test
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  
  // Modules à ignorer
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  
  // Alias de modules (pour matcher les paths de tsconfig)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Couverture de code
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/types/**',
  ],
  
  // Seuils de couverture (progressifs - à augmenter au fur et à mesure)
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  
  // Reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Transformations
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Timeout pour les tests async
  testTimeout: 30000,
};

module.exports = createJestConfig(customJestConfig);
