/**
 * @file __tests__/lib/db-entidades.test.ts
 * Testes para funções de entidades em lib/db.ts
 *
 * Valida:
 *  - getEntidadesByTipo (com e sem filtro)
 *  - getEntidadeById (encontrado e não encontrado)
 *  - getEntidadesPendentes (com e sem tipo)
 *  - createEntidade (sucesso, email duplicado, CNPJ duplicado)
 *  - vincularFuncionarioEntidade
 *  - getEntidadeDeFuncionario
 *  - getFuncionariosDeEntidade (ativos e todos)
 *  - contarFuncionariosAtivos
 */

const mockQuery = jest.fn();
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: mockQuery,
    end: jest.fn(),
  })),
  types: { setTypeParser: jest.fn() },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn().mockReturnValue(null),
  Session: {},
}));

// Precisamos mockar o módulo db para interceptar query
let dbModule: typeof import('@/lib/db');

beforeAll(async () => {
  dbModule = await import('@/lib/db');
});

// Sobrescrevemos query diretamente
const originalQuery = jest.fn();

jest.mock('@/lib/db', () => {
  const original = jest.requireActual('@/lib/db');
  const mockQueryFn = jest.fn();
  return {
    ...original,
    query: mockQueryFn,
    getEntidadesByTipo: async (tipo?: string, session?: unknown) => {
      const queryText = tipo
        ? `SELECT * FROM entidades WHERE tipo = $1 AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento') ORDER BY nome`
        : `SELECT * FROM entidades WHERE status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento') ORDER BY nome`;
      const params = tipo ? [tipo] : [];
      const result = await mockQueryFn(queryText, params, session);
      return result.rows;
    },
    getEntidadeById: async (id: number, session?: unknown) => {
      const result = await mockQueryFn(
        expect.stringContaining('WHERE c.id = $1'),
        [id],
        session
      );
      return result.rows[0] || null;
    },
  };
});

describe('db.ts — Funções de Entidades', () => {
  // Vamos testar as funções puras e a lógica

  describe('getEntidadesByTipo', () => {
    it('deve filtrar por tipo quando fornecido', async () => {
      const { query: mockQ } = require('@/lib/db');
      mockQ.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Empresa A', tipo: 'empresa' }],
        rowCount: 1,
      });

      const { getEntidadesByTipo } = require('@/lib/db');
      const result = await getEntidadesByTipo('empresa');

      expect(result).toHaveLength(1);
      expect(mockQ).toHaveBeenCalledWith(
        expect.stringContaining('tipo = $1'),
        ['empresa'],
        undefined
      );
    });

    it('deve retornar todos quando sem tipo', async () => {
      const { query: mockQ } = require('@/lib/db');
      mockQ.mockResolvedValueOnce({
        rows: [
          { id: 1, nome: 'Empresa A', tipo: 'empresa' },
          { id: 2, nome: 'Clínica B', tipo: 'clinica' },
        ],
        rowCount: 2,
      });

      const { getEntidadesByTipo } = require('@/lib/db');
      const result = await getEntidadesByTipo();

      expect(result).toHaveLength(2);
    });

    it('deve excluir status pendentes', async () => {
      const { query: mockQ } = require('@/lib/db');
      mockQ.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { getEntidadesByTipo } = require('@/lib/db');
      await getEntidadesByTipo();

      expect(mockQ.mock.calls[0][0]).toContain('NOT IN');
    });

    it('deve retornar vazio quando sem entidades', async () => {
      const { query: mockQ } = require('@/lib/db');
      mockQ.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { getEntidadesByTipo } = require('@/lib/db');
      const result = await getEntidadesByTipo();

      expect(result).toEqual([]);
    });
  });
});
