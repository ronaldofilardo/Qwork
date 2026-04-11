/**
 * Setup do Vitest para testes de regressão.
 *
 * Fornece `jest` como global (aliasado para `vi`) para testes que
 * usam `jest.mock()`, `jest.fn()` etc. sem importar de '@jest/globals'.
 */
import { vi } from 'vitest';

// Expõe `jest` como global para compatibilidade com testes escritos para Jest
(globalThis as unknown as Record<string, unknown>).jest = {
  ...vi,
  // jest.setTimeout → mapeia para vi.setConfig
  setTimeout: (ms: number) => vi.setConfig({ testTimeout: ms }),
};
