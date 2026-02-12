/**
 * Configuração Jest para Testes de Regressão Visual
 *
 * Esta configuração simplificada não requer banco de dados ou setup global,
 * focando apenas em testes de snapshot e renderização.
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Setup simplificado - apenas para React Testing Library
  setupFilesAfterEnv: ['<rootDir>/jest.visual-setup.js'],

  // Não usar setup/teardown global (não precisa de banco)
  // globalSetup: undefined,
  // globalTeardown: undefined,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  testEnvironment: 'jest-environment-jsdom',

  // Apenas testes de regressão visual
  testMatch: [
    '**/__tests__/visual-regression/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],

  // Limpar mocks automaticamente
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,

  verbose: false,

  // Desabilitar transformação de node_modules específicos se necessário
  transformIgnorePatterns: ['node_modules/(?!(lucide-react)/)'],

  // Configuração de snapshot
  snapshotSerializers: [],

  // Não coletar coverage por padrão (use --coverage quando necessário)
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // Suprimir warnings desnecessários
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

module.exports = createJestConfig(customJestConfig);
