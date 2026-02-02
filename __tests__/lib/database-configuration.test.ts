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
    test('should show clear message about development database when LOCAL_DATABASE_URL is not defined', () => {
      // This test verifies that the warning message is clear about using the correct database
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that the warning message mentions the development database
      expect(dbContent).toMatch(/banco "nr-bps_db"/);
    });

    test('should validate that test database URL points to test database', () => {
      // This test verifies that the validation logic exists
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that there's validation for test database URL
      expect(dbContent).toMatch(/TEST_DATABASE_URL.*banco de desenvolvimento/);
      expect(dbContent).toMatch(/nr-bps_db_test/);
    });

    test('should prevent development database usage in tests', () => {
      // This test verifies that isolation validation exists
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that there's validation preventing dev DB in tests
      expect(dbContent).toMatch(/banco de desenvolvimento.*ambiente de testes/);
    });

    test('should prevent test database usage in development', () => {
      // This test verifies that isolation validation exists
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that there's validation preventing test DB in development
      expect(dbContent).toMatch(
        /banco de testes.*desenvolvimento|test.*development.*banco/i
      );
    });
  });

  describe('Environment-specific database requirements', () => {
    test('should require TEST_DATABASE_URL for test environment', () => {
      // This test verifies that the error message for missing TEST_DATABASE_URL exists
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that TEST_DATABASE_URL is required for tests
      expect(dbContent).toMatch(/TEST_DATABASE_URL não está definido/);
      expect(dbContent).toMatch(/nr-bps_db_test/);
    });

    test('should require DATABASE_URL for production environment', () => {
      // This test verifies that DATABASE_URL is required for production
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that DATABASE_URL is required for production
      expect(dbContent).toMatch(
        /DATABASE_URL não está definido para ambiente de produção/
      );
    });

    test('should have fallback to development database when LOCAL_DATABASE_URL is not set', () => {
      // This test verifies that there's a fallback for development
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../lib/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify that there's a fallback database URL for development
      expect(dbContent).toMatch(
        /postgresql:\/\/postgres:123456@localhost:5432\/nr-bps_db/
      );
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
