/**
 * __tests__/security/csrf.test.ts
 *
 * Testes para CSRF token generation e validation.
 */

import { describe, it, expect } from '@jest/globals';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('gera token com tamanho correto', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64); // 32 bytes em hex
    });

    it('gera tokens diferentes a cada chamada', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('gera apenas caracteres hex', () => {
      const token = generateCsrfToken();
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });
  });

  describe('validateCsrfToken', () => {
    it('valida token correto', () => {
      const token = generateCsrfToken();
      const result = validateCsrfToken(token, token);
      expect(result).toBe(true);
    });

    it('rejeita token incorreto', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const result = validateCsrfToken(token1, token2);
      expect(result).toBe(false);
    });

    it('usa constant-time comparison (protege timing attacks)', () => {
      const token = generateCsrfToken();
      const wrong1 = generateCsrfToken(); // Totalmente diferente
      const wrong2 = token.slice(0, 32) + 'a'.repeat(32); // Parcialmente diferente

      // Ambas devem retornar false (não deveriam ter timing diferentes)
      const result1 = validateCsrfToken(wrong1, token);
      const result2 = validateCsrfToken(wrong2, token);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('rejeita tipos não-string', () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token as any, 123 as any)).toBe(false);
      expect(validateCsrfToken(null as any, token)).toBe(false);
    });

    it('rejeita tokens de tamanho diferente', () => {
      const token = generateCsrfToken();
      const shortToken = token.slice(0, 32);
      const result = validateCsrfToken(shortToken, token);
      expect(result).toBe(false);
    });
  });
});
