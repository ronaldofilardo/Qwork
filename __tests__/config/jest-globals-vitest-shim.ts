/**
 * Shim de compatibilidade Jest → Vitest para testes de regressão.
 *
 * Permite que testes importem de '@jest/globals' e funcionem no Vitest:
 *   import { jest, describe, it, expect } from '@jest/globals';
 *
 * Este arquivo é usado via resolve.alias no vitest.config.ts.
 */
export {
  describe,
  it,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';

export { vi as jest } from 'vitest';
