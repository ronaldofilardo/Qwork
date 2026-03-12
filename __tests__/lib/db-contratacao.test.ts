/**
 * @file __tests__/lib/db-contratacao.test.ts
 * Testes para lib/db-contratacao.ts — Funções de Contratação e Pagamentos
 *
 * Valida:
 *  - getPlanos, getPlanoById
 *  - getContratoById, getContratosByEntidade
 *  - iniciarPagamento, confirmarPagamento
 *  - getPagamentoById, getPagamentosByEntidade
 *  - atualizarStatusPagamento
 *  - entidadePodeLogar
 */

import {
  getPlanos,
  getPlanoById,
  getContratoById,
  getContratosByEntidade,
  iniciarPagamento,
  confirmarPagamento,
  getPagamentoById,
  getPagamentosByEntidade,
  atualizarStatusPagamento,
  entidadePodeLogar,
} from '@/lib/db-contratacao';

// Mock de db.query
const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  Session: {},
}));

// Mock do módulo de tipos
jest.mock('@/lib/types/contratacao', () => ({}), { virtual: true });

describe('db-contratacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // getPlanos
  // ==========================================================================
  describe('getPlanos', () => {
    it('deve retornar lista de planos ativos', async () => {
      const mockPlanos = [
        { id: 1, nome: 'Básico', preco: 50, ativo: true },
        { id: 2, nome: 'Premium', preco: 100, ativo: true },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPlanos, rowCount: 2 });

      const result = await getPlanos();

      expect(result).toEqual(mockPlanos);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM planos WHERE ativo = true'),
        [],
        undefined
      );
    });

    it('deve retornar lista vazia quando sem planos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const result = await getPlanos();
      expect(result).toEqual([]);
    });

    it('deve passar session quando fornecida', async () => {
      const session = { cpf: '12345678900', perfil: 'admin' };
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await getPlanos(session as any);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [],
        session
      );
    });

    it('deve ordenar por preço ASC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await getPlanos();
      expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY preco ASC');
    });
  });

  // ==========================================================================
  // getPlanoById
  // ==========================================================================
  describe('getPlanoById', () => {
    it('deve retornar plano quando existe', async () => {
      const plano = { id: 1, nome: 'Básico', preco: 50, ativo: true };
      mockQuery.mockResolvedValueOnce({ rows: [plano], rowCount: 1 });

      const result = await getPlanoById(1);

      expect(result).toEqual(plano);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM planos WHERE id = $1'),
        [1],
        undefined
      );
    });

    it('deve retornar null quando plano não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await getPlanoById(999);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getContratoById
  // ==========================================================================
  describe('getContratoById', () => {
    it('deve retornar contrato quando existe', async () => {
      const contrato = { id: 1, tomador_id: 10, plano_id: 1, status: 'ativo' };
      mockQuery.mockResolvedValueOnce({ rows: [contrato], rowCount: 1 });

      const result = await getContratoById(1);

      expect(result).toEqual(contrato);
    });

    it('deve retornar null quando contrato não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await getContratoById(999);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getContratosByEntidade
  // ==========================================================================
  describe('getContratosByEntidade', () => {
    it('deve retornar contratos da entidade', async () => {
      const contratos = [
        { id: 1, tomador_id: 10, status: 'ativo' },
        { id: 2, tomador_id: 10, status: 'cancelado' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: contratos, rowCount: 2 });

      const result = await getContratosByEntidade(10);

      expect(result).toEqual(contratos);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('tomador_id = $1'),
        [10],
        undefined
      );
    });

    it('deve ordenar por criado_em DESC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await getContratosByEntidade(1);
      expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY criado_em DESC');
    });

    it('deve retornar vazio quando sem contratos', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const result = await getContratosByEntidade(999);
      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // iniciarPagamento
  // ==========================================================================
  describe('iniciarPagamento', () => {
    it('deve criar novo pagamento com status pendente', async () => {
      const pagamento = { id: 1, entidade_id: 5, valor: 100, status: 'pendente' };
      mockQuery.mockResolvedValueOnce({ rows: [pagamento], rowCount: 1 });

      const result = await iniciarPagamento({
        entidade_id: 5,
        valor: 100,
        metodo: 'pix',
      } as any);

      expect(result).toEqual(pagamento);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO pagamentos');
      expect(mockQuery.mock.calls[0][0]).toContain("'pendente'");
    });

    it('deve usar Asaas como plataforma padrão', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      await iniciarPagamento({
        entidade_id: 5,
        valor: 200,
        metodo: 'cartao',
      } as any);

      // O 5o parâmetro (plataforma_nome) deve ser 'Asaas'
      expect(mockQuery.mock.calls[0][1]).toContain('Asaas');
    });

    it('deve aceitar contrato_id opcional', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      await iniciarPagamento({
        entidade_id: 5,
        contrato_id: 10,
        valor: 150,
        metodo: 'boleto',
      } as any);

      expect(mockQuery.mock.calls[0][1]).toContain(10);
    });
  });

  // ==========================================================================
  // confirmarPagamento
  // ==========================================================================
  describe('confirmarPagamento', () => {
    it('deve atualizar pagamento para status pago', async () => {
      const pagamento = { id: 1, status: 'pago', data_pagamento: '2026-01-01', contrato_id: 10 };
      // confirmarPagamento faz 3 queries: UPDATE pagamentos, SELECT contratos, UPDATE entidades
      mockQuery
        .mockResolvedValueOnce({ rows: [pagamento], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ tomador_id: 5 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await confirmarPagamento(1);

      expect(result).toEqual(pagamento);
      expect(mockQuery.mock.calls[0][0]).toContain("status = 'pago'");
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('deve aceitar plataforma_id opcional', async () => {
      const pagamento = { id: 1, contrato_id: 10 };
      mockQuery
        .mockResolvedValueOnce({ rows: [pagamento], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ tomador_id: 5 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await confirmarPagamento(1, 'pay_abc123');

      expect(mockQuery.mock.calls[0][1]).toContain('pay_abc123');
    });
  });

  // ==========================================================================
  // getPagamentoById
  // ==========================================================================
  describe('getPagamentoById', () => {
    it('deve retornar pagamento quando existe', async () => {
      const pagamento = { id: 1, valor: 100, status: 'pendente' };
      mockQuery.mockResolvedValueOnce({ rows: [pagamento], rowCount: 1 });

      const result = await getPagamentoById(1);

      expect(result).toEqual(pagamento);
    });

    it('deve retornar null quando pagamento não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await getPagamentoById(999);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getPagamentosByEntidade
  // ==========================================================================
  describe('getPagamentosByEntidade', () => {
    it('deve retornar pagamentos de uma entidade', async () => {
      const pagamentos = [
        { id: 1, entidade_id: 5, status: 'pago' },
        { id: 2, entidade_id: 5, status: 'pendente' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: pagamentos, rowCount: 2 });

      const result = await getPagamentosByEntidade(5);

      expect(result).toEqual(pagamentos);
    });
  });

  // ==========================================================================
  // atualizarStatusPagamento
  // ==========================================================================
  describe('atualizarStatusPagamento', () => {
    it('deve atualizar status do pagamento', async () => {
      const pagamento = { id: 1, status: 'pago' };
      mockQuery.mockResolvedValueOnce({ rows: [pagamento], rowCount: 1 });

      const result = await atualizarStatusPagamento(1, 'pago' as any);

      expect(result).toBeTruthy();
      expect(mockQuery.mock.calls[0][0]).toContain('UPDATE pagamentos');
      expect(mockQuery.mock.calls[0][1]).toContain('pago');
    });

    it('deve aceitar diferentes status', async () => {
      const statuses = ['pendente', 'pago', 'cancelado', 'estornado'];

      for (const status of statuses) {
        mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status }], rowCount: 1 });
        await atualizarStatusPagamento(1, status as any);
      }

      expect(mockQuery).toHaveBeenCalledTimes(statuses.length);
    });
  });

  // ==========================================================================
  // entidadePodeLogar
  // ==========================================================================
  describe('entidadePodeLogar', () => {
    it('deve verificar se entidade pode logar', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ pode_logar: true }], rowCount: 1 });

      const result = await entidadePodeLogar(5);
      expect(result).toBe(true);
    });

    it('deve retornar false quando entidade não pode logar', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ pode_logar: false }], rowCount: 1 });

      const result = await entidadePodeLogar(5);
      expect(result).toBe(false);
    });

    it('deve retornar false quando sem resultado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await entidadePodeLogar(999);
      expect(result).toBe(false);
    });
  });
});
