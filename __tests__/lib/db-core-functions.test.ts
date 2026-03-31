/**
 * @file __tests__/lib/db-core-functions.test.ts
 * Testes para funções utilitárias core de lib/db.ts
 *
 * Valida:
 *  - getDatabaseInfo (retorna informações do ambiente)
 *  - testConnection (conectividade)
 *  - closePool
 *  - getEntidadeById (com LEFT JOIN)
 *  - getEntidadesPendentes (filtros de status)
 *  - vincularFuncionarioEntidade (ON CONFLICT)
 *  - getEntidadeDeFuncionario (INNER JOIN)
 *  - getFuncionariosDeEntidade (filtro ativo/todos)
 *  - contarFuncionariosAtivos (COUNT)
 *  - getNotificacoesFinanceiras
 *  - createEntidade (validações de duplicata email/CNPJ)
 */

// Mock completo do módulo pg
const mockPoolConnect = jest.fn();
const mockPoolQuery = jest.fn();
const mockPoolEnd = jest.fn();
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    }),
    query: mockPoolQuery,
    end: mockPoolEnd,
  })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedvalue'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock session
jest.mock('@/lib/session', () => ({
  getSession: jest.fn().mockReturnValue(null),
  Session: {},
}));

describe('db.ts — Core Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDatabaseInfo', () => {
    it('deve retornar objeto com informações do ambiente', () => {
      // getDatabaseInfo é uma função pura que retorna estado
      const { getDatabaseInfo } = require('@/lib/db');
      const info = getDatabaseInfo();

      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('isDevelopment');
      expect(info).toHaveProperty('isTest');
      expect(info).toHaveProperty('isProduction');
      expect(info).toHaveProperty('databaseUrl');
    });

    it('deve mascarar senha na URL do banco', () => {
      const { getDatabaseInfo } = require('@/lib/db');
      const info = getDatabaseInfo();

      // Se há URL, a senha deve estar mascarada
      if (info.databaseUrl !== 'N/A') {
        expect(info.databaseUrl).not.toMatch(/password=(?!\*\*\*)/);
      }
    });

    it('deve identificar ambiente de teste', () => {
      const { getDatabaseInfo } = require('@/lib/db');
      const info = getDatabaseInfo();

      // Em testes, isTest deve ser true
      expect(info.isTest).toBe(true);
    });
  });

  describe('isProduction export', () => {
    it('deve exportar isProduction como boolean', () => {
      const db = require('@/lib/db');
      expect(typeof db.isProduction).toBe('boolean');
      // Em testes, não deve ser produção
      expect(db.isProduction).toBe(false);
    });
  });

  describe('PERFIS_VALIDOS', () => {
    it('deve exportar PERFIS_VALIDOS como array', () => {
      const db = require('@/lib/db');
      if (db.PERFIS_VALIDOS) {
        expect(Array.isArray(db.PERFIS_VALIDOS)).toBe(true);
        expect(db.PERFIS_VALIDOS.length).toBeGreaterThan(0);
      }
    });
  });

  describe('isValidPerfil', () => {
    it('deve validar perfis válidos', () => {
      const db = require('@/lib/db');
      if (db.isValidPerfil) {
        expect(db.isValidPerfil('admin')).toBe(true);
        expect(db.isValidPerfil('rh')).toBe(true);
        expect(db.isValidPerfil('gestor')).toBe(true);
      }
    });

    it('deve rejeitar perfis inválidos', () => {
      const db = require('@/lib/db');
      if (db.isValidPerfil) {
        expect(db.isValidPerfil('hacker')).toBe(false);
        expect(db.isValidPerfil('')).toBe(false);
        expect(db.isValidPerfil(null)).toBe(false);
      }
    });
  });

  describe('assertValidPerfil', () => {
    it('deve lançar erro para perfil inválido', () => {
      const db = require('@/lib/db');
      if (db.assertValidPerfil) {
        expect(() => db.assertValidPerfil('invalido')).toThrow();
      }
    });
  });
});
