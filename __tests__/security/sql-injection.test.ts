/**
 * __tests__/security/sql-injection.test.ts
 *
 * Testes para SQL Injection prevention (SET LOCAL sanitization).
 */

import { describe, it, expect } from '@jest/globals';
import {
  escapeCpfForSql,
  escapePerfilForSql,
  escapeSqlString,
  buildSetLocalQueries,
} from '@/lib/db-safe';

describe('SQL Injection Prevention (db-safe)', () => {
  describe('escapeSqlString', () => {
    it('escapa aspas simples', () => {
      const input = "O'Brien";
      const result = escapeSqlString(input);
      expect(result).toBe("O''Brien");
    });

    it('escapa múltiplas aspas', () => {
      const input = "a'b'c'd";
      const result = escapeSqlString(input);
      expect(result).toBe("a''b''c''d");
    });

    it('remove null bytes', () => {
      const input = 'test\x00value';
      const result = escapeSqlString(input);
      expect(result).not.toContain('\x00');
    });

    it('escapa backslashes', () => {
      const input = 'test\\value';
      const result = escapeSqlString(input);
      expect(result).toBe('test\\\\value');
    });
  });

  describe('escapeCpfForSql', () => {
    it('aceita CPF com 11 dígitos', () => {
      const result = escapeCpfForSql('12345678901');
      expect(result).toBe('12345678901');
    });

    it('remove pontos e traços', () => {
      const result = escapeCpfForSql('123.456.789-01');
      expect(result).toBe('12345678901');
    });

    it('rejeita CPF com caracteres speciais', () => {
      expect(() => escapeCpfForSql("'; DROP TABLE users; --")).toThrow();
    });

    it('rejeita CPF com menos de 11 dígitos', () => {
      expect(() => escapeCpfForSql('1234567890')).toThrow();
    });
  });

  describe('escapePerfilForSql', () => {
    it('aceita perfis válidos', () => {
      const validPerfis = ['admin', 'rh', 'emissor', 'gestor', 'funcionario'];
      for (const perfil of validPerfis) {
        expect(escapePerfilForSql(perfil)).toBe(perfil);
      }
    });

    it('rejeita perfis inválidos', () => {
      expect(() => escapePerfilForSql("'; DROP TABLE users; --")).toThrow();
      expect(() => escapePerfilForSql('superadmin')).toThrow();
    });
  });

  describe('buildSetLocalQueries', () => {
    it('gera queries seguras', () => {
      const queries = buildSetLocalQueries({
        cpf: '12345678901',
        perfil: 'rh',
        clinica_id: 123,
      });

      expect(queries).toHaveLength(3);
      expect(queries[0]).toContain(
        "SET LOCAL app.current_user_cpf = '12345678901'"
      );
      expect(queries[1]).toContain("SET LOCAL app.current_user_perfil = 'rh'");
      expect(queries[2]).toContain(
        "SET LOCAL app.current_user_clinica_id = '123'"
      );
    });

    it('rejeita CPF com caracteres não-numéricos (proteção SQL)', () => {
      // CPF com aspas deve ser rejeitado antes de chegar ao SQL
      expect(() =>
        buildSetLocalQueries({ cpf: "123'456'78901", perfil: 'rh' })
      ).toThrow();
    });

    it('valida perfil antes de gerar query', () => {
      expect(() =>
        buildSetLocalQueries({ cpf: '12345678901', perfil: 'invalid_perfil' })
      ).toThrow();
    });

    it('sanitiza IDs numéricos', () => {
      const queries = buildSetLocalQueries({
        cpf: '12345678901',
        perfil: 'rh',
        clinica_id: -999, // Negativo
      });

      // Deve aceitar (usamos Math.abs)
      expect(queries[2]).toContain('999');
    });
  });
});
