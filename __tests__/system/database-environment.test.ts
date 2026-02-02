/**
 * TESTE DE PROTEÇÃO: Validação de Configuração de Bancos de Dados
 *
 * Este teste garante que a segregação de ambientes está correta.
 * SE ESTE TESTE FALHAR, A CONFIGURAÇÃO FOI CORROMPIDA!
 *
 * Data: 31/01/2026
 * Status: CRÍTICO - NÃO REMOVER
 */

import fs from 'fs';
import path from 'path';

describe('🔒 PROTEÇÃO: Configuração de Bancos de Dados', () => {
  const rootDir = path.join(__dirname, '../..');

  describe('Validação de .env.local (Desenvolvimento)', () => {
    it('DEVE usar nr-bps_db local (NÃO Neon Cloud)', () => {
      const envLocalPath = path.join(rootDir, '.env.local');

      if (!fs.existsSync(envLocalPath)) {
        throw new Error('❌ .env.local não encontrado!');
      }

      const content = fs.readFileSync(envLocalPath, 'utf-8');

      // DEVE ter LOCAL_DATABASE_URL apontando para nr-bps_db
      expect(content).toMatch(/LOCAL_DATABASE_URL=.*localhost:5432\/nr-bps_db/);

      // NÃO DEVE ter LOCAL_DATABASE_URL apontando para Neon Cloud
      const localDbLine = content
        .split('\n')
        .find(
          (line) =>
            line.startsWith('LOCAL_DATABASE_URL=') && !line.includes('#')
        );

      if (localDbLine) {
        expect(localDbLine).not.toContain('neon.tech');
        expect(localDbLine).toContain('localhost:5432/nr-bps_db');
      }
    });

    it('NÃO DEVE usar ALLOW_PROD_DB_LOCAL=true', () => {
      const envLocalPath = path.join(rootDir, '.env.local');
      const content = fs.readFileSync(envLocalPath, 'utf-8');

      // ALLOW_PROD_DB_LOCAL deve estar comentado ou false
      const allowProdLine = content
        .split('\n')
        .find(
          (line) =>
            line.includes('ALLOW_PROD_DB_LOCAL') && !line.startsWith('#')
        );

      if (allowProdLine) {
        expect(allowProdLine).not.toContain('ALLOW_PROD_DB_LOCAL=true');
      }
    });
  });

  describe('Validação de .env.test (Testes)', () => {
    it('DEVE usar APENAS nr-bps_db_test', () => {
      const envTestPath = path.join(rootDir, '.env.test');

      if (!fs.existsSync(envTestPath)) {
        throw new Error('❌ .env.test não encontrado!');
      }

      const content = fs.readFileSync(envTestPath, 'utf-8');

      // DEVE ter TEST_DATABASE_URL apontando para nr-bps_db_test
      expect(content).toMatch(/TEST_DATABASE_URL=.*nr-bps_db_test/);

      // NÃO DEVE ter referência a nr-bps_db (sem _test)
      const testDbLine = content
        .split('\n')
        .find(
          (line) => line.startsWith('TEST_DATABASE_URL=') && !line.includes('#')
        );

      if (testDbLine) {
        expect(testDbLine).toContain('nr-bps_db_test');
        expect(testDbLine).not.toMatch(/nr-bps_db[^_]/);
      }
    });

    it('NÃO DEVE usar Neon Cloud em testes', () => {
      const envTestPath = path.join(rootDir, '.env.test');
      const content = fs.readFileSync(envTestPath, 'utf-8');

      expect(content).not.toContain('neon.tech');
    });
  });

  describe('Validação de .env (Fallback)', () => {
    it('DEVE ter LOCAL_DATABASE_URL para nr-bps_db', () => {
      const envPath = path.join(rootDir, '.env');

      if (!fs.existsSync(envPath)) {
        console.warn('⚠️  .env não encontrado (esperado em alguns casos)');
        return;
      }

      const content = fs.readFileSync(envPath, 'utf-8');

      // DEVE ter LOCAL_DATABASE_URL para desenvolvimento
      const localDbLine = content
        .split('\n')
        .find(
          (line) =>
            line.startsWith('LOCAL_DATABASE_URL=') && !line.includes('#')
        );

      if (localDbLine) {
        expect(localDbLine).toContain('localhost:5432/nr-bps_db');
        expect(localDbLine).not.toContain('neon.tech');
      }
    });
  });

  describe('Validação de Scripts de Teste', () => {
    it('run-tests.ps1 DEVE usar nr-bps_db_test', () => {
      const scriptPath = path.join(
        rootDir,
        '__tests__/correcoes-31-01-2026/run-tests.ps1'
      );

      if (!fs.existsSync(scriptPath)) {
        return; // Script pode não existir em alguns ambientes
      }

      const content = fs.readFileSync(scriptPath, 'utf-8');

      // DEVE configurar TEST_DATABASE_URL para nr-bps_db_test
      expect(content).toMatch(/TEST_DATABASE_URL.*nr-bps_db_test/);

      // DEVE configurar DATABASE_URL para nr-bps_db_test (durante testes)
      expect(content).toMatch(/DATABASE_URL.*nr-bps_db_test/);
    });
  });

  describe('Proteção contra Regressão', () => {
    it('NÃO DEVE ter nr-bps_db_test em .env.local', () => {
      const envLocalPath = path.join(rootDir, '.env.local');

      if (!fs.existsSync(envLocalPath)) {
        return;
      }

      const content = fs.readFileSync(envLocalPath, 'utf-8');

      // LOCAL_DATABASE_URL não deve apontar para banco de teste
      const localDbLine = content
        .split('\n')
        .find(
          (line) =>
            line.startsWith('LOCAL_DATABASE_URL=') && !line.includes('#')
        );

      if (localDbLine) {
        expect(localDbLine).not.toContain('nr-bps_db_test');
      }
    });

    it('NÃO DEVE ter neon.tech em LOCAL_DATABASE_URL de desenvolvimento', () => {
      const files = ['.env.local', '.env.development', '.env'];

      files.forEach((fileName) => {
        const filePath = path.join(rootDir, fileName);

        if (!fs.existsSync(filePath)) {
          return;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const localDbLine = content
          .split('\n')
          .find(
            (line) =>
              line.startsWith('LOCAL_DATABASE_URL=') && !line.includes('#')
          );

        if (localDbLine) {
          expect(localDbLine).not.toContain('neon.tech');
        }
      });
    });
  });

  describe('Documentação', () => {
    it('DATABASE-POLICY.md DEVE existir', () => {
      const policyPath = path.join(rootDir, 'DATABASE-POLICY.md');
      expect(fs.existsSync(policyPath)).toBe(true);
    });

    it('DATABASE-POLICY.md DEVE conter segregação correta', () => {
      const policyPath = path.join(rootDir, 'DATABASE-POLICY.md');

      if (!fs.existsSync(policyPath)) {
        throw new Error('❌ DATABASE-POLICY.md não encontrado!');
      }

      const content = fs.readFileSync(policyPath, 'utf-8');

      expect(content).toContain('nr-bps_db');
      expect(content).toContain('nr-bps_db_test');
      expect(content).toContain('neondb');
      expect(content).toContain('DESENVOLVIMENTO');
      expect(content).toContain('PRODUÇÃO');
      expect(content).toContain('TESTES');
    });
  });
});
