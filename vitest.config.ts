import { defineConfig } from 'vitest/config';
import path from 'path';

const root = process.cwd();

/**
 * Vitest config — restrito a testes de regressão/estáticos.
 *
 * Os testes de integração e unitários do projeto usam Jest (jest.config.cjs).
 * Execute com: pnpm test  ou  jest
 *
 * Esta config permite rodar os testes de regressão ZapSign e demais testes
 * que usam `import { ... } from 'vitest'` ou `import { ... } from '@jest/globals'`:
 *   npx vitest run        (ou: pnpm test:regression)
 *   npx vitest run __tests__/regression
 */
export default defineConfig({
  resolve: {
    alias: {
      // Redireciona @jest/globals para o shim de compatibilidade Vitest
      '@jest/globals': path.resolve(
        root,
        '__tests__/config/jest-globals-vitest-shim.ts'
      ),
      // Resolve aliases @/ usados em imports de produção referenciados nos testes
      '@': root,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Setup: expõe `jest` como global (alias de `vi`) para testes que usam
    // jest.mock() / jest.fn() sem importar de '@jest/globals'
    setupFiles: ['__tests__/config/vitest.setup.ts'],
    // Inclui APENAS os testes de regressão/vitest-nativos.
    // Os demais (jest-environment-jsdom, DB setup, etc.) rodam via pnpm test (Jest).
    include: ['__tests__/regression/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/cypress/**'],
    env: {
      NODE_ENV: 'test',
      TEST_DATABASE_URL:
        'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
    },
  },
});
