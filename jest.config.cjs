const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  rootDir: './',
  setupFiles: ['<rootDir>/__tests__/config/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/config/jest.react-setup.js'],
  globalSetup: '<rootDir>/__tests__/config/jest.global-setup.cjs',
  globalTeardown: '<rootDir>/__tests__/config/jest.global-teardown.cjs',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/e2e/', // Ignorar testes E2E do Playwright
    '<rootDir>/cypress/', // Ignorar testes Cypress
    '<rootDir>/__obsolete_tests__/', // Ignorar testes obsoletos
    '\\.spec\\.ts$', // Ignorar arquivos *.spec.ts
  ],
  testMatch: [
    '**/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
    '!**/docs/**', // Ignorar arquivos de documentação
  ],

  // Configurações para melhor debugging de mocks (Política de Mocks)
  clearMocks: true, // Limpa mocks automaticamente entre testes
  resetMocks: false, // Não reseta implementação, apenas chamadas
  restoreMocks: false, // Não restaura mocks originais

  // Melhor reporting para debugging
  verbose: false, // Pode ser ativado com --verbose
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],

  // Definir NODE_ENV=test para testes
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.TEST_DATABASE_URL':
      'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
  },
};

// Permitir ignorar globalSetup em execuções locais de unit tests definindo SKIP_GLOBAL_JEST_SETUP=1
if (process.env.SKIP_GLOBAL_JEST_SETUP === '1') {
  delete customJestConfig.globalSetup;
  delete customJestConfig.globalTeardown;
  console.log(
    '[jest.config] SKIP_GLOBAL_JEST_SETUP=1 — globalSetup/globalTeardown removidos'
  );
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
