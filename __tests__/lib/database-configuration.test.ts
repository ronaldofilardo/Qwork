/**
 * @file __tests__/lib/database-configuration.test.ts
 * Testes: Database Configuration Tests
 */

import { jest } from '@jest/globals';

// Importar o guard de proteção do banco de testes
import {
  enableTestDatabaseGuard,
  forceEnableTestDatabaseGuard,
  disableTestDatabaseGuard,
  assertTestDatabase,
  getDatabaseInfo,
} from './test-database-guard';

// Mock do módulo pg para evitar conexões reais durante os testes
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock do bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock do session
jest.mock('../../lib/session', () => ({
  Session: {},
}));

describe('Database Configuration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    jest.resetModules();
    // Reset guard state
    disableTestDatabaseGuard();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Database URL validation messages', () => {
    // Fonte de verdade: lib/db/connection.ts (módulo principal de conexão)
    test('should show clear message about development database when LOCAL_DATABASE_URL is not defined', () => {
      // Verifica que a mensagem de erro menciona o banco de desenvolvimento
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // A mensagem de erro deve mencionar o banco nr-bps_db
      expect(dbContent).toMatch(/banco "nr-bps_db"/);
    });

    test('should validate that test database URL points to test database', () => {
      // Verifica que existe validação da URL de teste
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      expect(dbContent).toMatch(/TEST_DATABASE_URL.*banco de desenvolvimento/);
      expect(dbContent).toMatch(/nr-bps_db_test/);
    });

    test('should prevent development database usage in tests', () => {
      // Verifica que existe validação que impede banco de dev em testes
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // O módulo deve ter mensagem que menciona tentativa de usar banco de dev em testes
      expect(dbContent).toMatch(/uso acidental do banco de desenvolvimento/i);
    });

    test('should prevent test database usage in development', () => {
      // Verifica que existe validação que impede banco de teste em desenvolvimento
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      expect(dbContent).toMatch(
        /banco de testes.*desenvolvimento|test.*development.*banco/i
      );
    });
  });

  describe('Environment-specific database requirements', () => {
    test('should require TEST_DATABASE_URL for test environment', () => {
      // Verifica que TEST_DATABASE_URL é exigida para ambiente de testes
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      expect(dbContent).toMatch(/TEST_DATABASE_URL não está definido/);
      expect(dbContent).toMatch(/nr-bps_db_test/);
    });

    test('should require DATABASE_URL for production environment', () => {
      // Verifica que DATABASE_URL é exigida para produção
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      expect(dbContent).toMatch(
        /DATABASE_URL não está definido para ambiente de produção/
      );
    });

    test('should throw error (not use hardcoded credentials) when LOCAL_DATABASE_URL is not set', () => {
      // SEGURANÇA: verifica que o módulo lança erro em vez de usar URL hardcoded
      // com credenciais padrão quando LOCAL_DATABASE_URL não está definido.
      // Corrigido em 01/04/2026 — remoção de credenciais hardcoded (OWASP A2).
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db/connection.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // NÃO deve conter URL hardcoded como fallback
      expect(dbContent).not.toMatch(
        /return 'postgresql:\/\/postgres:123456@localhost:5432\/nr-bps_db'/
      );

      // DEVE lançar erro com mensagem clara quando LOCAL_DATABASE_URL não está definido
      expect(dbContent).toMatch(/throw new Error/);
      expect(dbContent).toMatch(/LOCAL_DATABASE_URL não está definido/);
      expect(dbContent).toMatch(/DATABASE_SETUP\.md/);
    });
  });

  describe('Test Database Guard', () => {
    test('should enable guard with valid test database URL', () => {
      process.env.TEST_DATABASE_URL =
        'postgres://postgres:123456@localhost:5432/nr-bps_db_test';

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      // Não deve lançar erro
      expect(() => enableTestDatabaseGuard()).not.toThrow();
    });

    test('should throw error when TEST_DATABASE_URL is not defined', () => {
      delete process.env.TEST_DATABASE_URL;

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      expect(() => enableTestDatabaseGuard()).toThrow(
        /TEST_DATABASE_URL não está definido/
      );
    });

    test('should throw error when using development database in tests', () => {
      process.env.TEST_DATABASE_URL =
        'postgresql://postgres:123456@localhost:5432/nr-bps_db';

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      expect(() => enableTestDatabaseGuard()).toThrow(/nr-bps_db/);
      expect(() => enableTestDatabaseGuard()).toThrow(/DESENVOLVIMENTO/);
    });

    test('should throw error when using nr-bps-db (with hyphen) in tests', () => {
      process.env.TEST_DATABASE_URL =
        'postgres://postgres:123456@localhost:5432/nr-bps-db';

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      expect(() => enableTestDatabaseGuard()).toThrow(/nr-bps/);
    });

    test('should get database info correctly', () => {
      process.env.TEST_DATABASE_URL =
        'postgres://postgres:123456@localhost:5432/nr-bps_db_test';

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      const info = getDatabaseInfo();
      expect(info.name).toBe('nr-bps_db_test');
      expect(info.isTest).toBe(true);
      expect(info.isDevelopment).toBe(false);
    });

    test('should identify development database correctly', () => {
      process.env.LOCAL_DATABASE_URL =
        'postgresql://postgres:123456@localhost:5432/nr-bps_db';
      delete process.env.TEST_DATABASE_URL;

      const info = getDatabaseInfo();
      expect(info.name).toBe('nr-bps_db');
      expect(info.isTest).toBe(false);
      expect(info.isDevelopment).toBe(true);
    });

    test('should disable and re-enable guard', () => {
      process.env.TEST_DATABASE_URL =
        'postgres://postgres:123456@localhost:5432/nr-bps_db_test';

      // Force enable for testing
      forceEnableTestDatabaseGuard();

      enableTestDatabaseGuard();
      disableTestDatabaseGuard();

      // Deve poder reativar sem erro
      expect(() => enableTestDatabaseGuard()).not.toThrow();
    });
  });
});
