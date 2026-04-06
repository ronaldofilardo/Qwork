/**
 * __tests__/security/sanitization.test.ts
 *
 * Testes para input sanitization (XSS prevention).
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtmlText,
  sanitizeHtmlAttribute,
  sanitizeTextField,
  stripHtmlTags,
  sanitizeCpf,
  sanitizeCnpj,
  sanitizeEmail,
} from '@/lib/sanitize';

describe('Input Sanitization (XSS Prevention)', () => {
  describe('sanitizeHtmlText', () => {
    it('escapa tags HTML', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeHtmlText(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('escapa quotes', () => {
      const input = 'test "quoted" text';
      const result = sanitizeHtmlText(input);
      expect(result).toContain('&quot;');
    });

    it('limita tamanho de texto', () => {
      const longText = 'a'.repeat(10000);
      const result = sanitizeHtmlText(longText);
      expect(result.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('sanitizeHtmlAttribute', () => {
    it('escapa quotes e sinais especiais', () => {
      const input = 'value" onload="alert()';
      const result = sanitizeHtmlAttribute(input);
      expect(result).not.toContain('"');
      expect(result).toContain('&quot;');
    });

    it('limita tamanho', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizeHtmlAttribute(longText);
      expect(result.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('stripHtmlTags', () => {
    it('remove script tags', () => {
      const input = 'Text<script>bad()</script>more';
      const result = stripHtmlTags(input);
      expect(result).not.toContain('script');
      expect(result.includes('Text')).toBe(true);
    });

    it('remove todas as tags HTML', () => {
      const input = '<div><p>Hello</p></div>';
      const result = stripHtmlTags(input);
      expect(result).toBe('Hello');
    });
  });

  describe('Validação de Documentos', () => {
    it('sanitizeCpf válido', () => {
      const result = sanitizeCpf('123.456.789-01');
      expect(result).toBe('12345678901');
    });

    it('sanitizeCpf inválido', () => {
      expect(() => sanitizeCpf('123-456')).toThrow();
      expect(() => sanitizeCpf('abc')).toThrow();
    });

    it('sanitizeCnpj válido', () => {
      const result = sanitizeCnpj('12.345.678/0001-99');
      expect(result).toBe('12345678000199');
    });

    it('sanitizeEmail válido', () => {
      const result = sanitizeEmail('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('sanitizeEmail inválido', () => {
      expect(() => sanitizeEmail('invalid')).toThrow();
      expect(() => sanitizeEmail('test@')).toThrow();
    });
  });

  describe('sanitizeTextField', () => {
    it('remove caracteres de controle', () => {
      const input = 'test\x00value\x1F';
      const result = sanitizeTextField(input);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x1F');
    });

    it('escapa HTML', () => {
      const input = 'hello <script>';
      const result = sanitizeTextField(input);
      expect(result).not.toContain('<script>');
    });

    it('respeita maxLen', () => {
      const result = sanitizeTextField('a'.repeat(1000), 100);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });
});
