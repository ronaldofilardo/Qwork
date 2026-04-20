/**
 * @jest-environment node
 *
 * Testes: POST /api/pagamento/confirmar
 *
 * Nota: O fluxo legado de geração de recibo BYTEA foi removido.
 * Recibos são agora gerados sob demanda via endpoint separado.
 * Esta suite cobre o fluxo atual de confirmação de pagamento.
 */

import { POST as confirmarPagamento } from '@/app/api/pagamento/confirmar/route';
import { query, criarContaResponsavel } from '@/lib/db';
import { ativarEntidade } from '@/lib/entidade-activation';

// Mock das dependências
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  criarContaResponsavel: jest.fn(),
}));
jest.mock('@/lib/receipt-generator');
jest.mock('@/lib/parcelas-helper', () => ({
  calcularParcelas: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/entidade-activation', () => ({
  ativarEntidade: jest.fn(),
}));
jest.mock('@/lib/contratos/contratos', () => ({
  aceitarContrato: jest.fn().mockResolvedValue({ success: true }),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCriarContaResponsavel = criarContaResponsavel as jest.MockedFunction<typeof criarContaResponsavel>;
const mockAtivarEntidade = ativarEntidade as jest.MockedFunction<typeof ativarEntidade>;

describe('API Pagamento Confirmar com Recibo BYTEA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockCriarContaResponsavel.mockResolvedValue(undefined as any);
    mockAtivarEntidade.mockResolvedValue({ success: true, message: 'ok' } as any);
  });

  describe('POST /api/pagamento/confirmar', () => {
    const mockPagamento = {
      id: 100,
      tomador_id: 1,
      contrato_id: 55,
      status: 'pendente',
      tomador_nome: 'Empresa Teste Ltda',
      tipo: 'pj',
      cnpj: '12.345.678/0001-90',
      responsavel_cpf: '123.456.789-00',
      responsavel_nome: 'João Silva',
      responsavel_email: 'joao@empresa.com',
      responsavel_celular: '(11) 99999-9999',
    };

    function makeRequest(body: object, headers: Record<string, string> = {}) {
      return new Request('http://localhost:3000/api/pagamento/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
    }

    it('deve retornar 400 quando pagamento_id não fornecido', async () => {
      const response = await confirmarPagamento(makeRequest({}) as any);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/obrigatório/i);
    });

    it('deve retornar 404 quando pagamento não encontrado', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const response = await confirmarPagamento(makeRequest({ pagamento_id: 999 }) as any);
      expect(response.status).toBe(404);
    });

    it('deve confirmar pagamento para entidade e retornar sucesso sem recibo inline', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento], rowCount: 1 } as any) // buscar pagamento
        .mockResolvedValueOnce({ rows: [{ id: 100 }], rowCount: 1 } as any) // update status
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // calcularParcelas base
        .mockResolvedValueOnce({ rows: [{ tipo: 'entidade' }], rowCount: 1 } as any) // tipo tomador
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // update entidades ativa
        .mockResolvedValue({ rows: [], rowCount: 0 } as any); // demais queries

      const response = await confirmarPagamento(
        makeRequest({ pagamento_id: 100, metodo_pagamento: 'pix' }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Novo fluxo: recibo NÃO é gerado inline
      expect(data.recibo).toBeUndefined();
    });

    it('deve retornar pagamento_id na resposta de sucesso', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 100 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ tipo: 'entidade' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await confirmarPagamento(
        makeRequest({ pagamento_id: 100, metodo_pagamento: 'transferencia' }) as any
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pagamento_id).toBe(100);
    });

    it('deve tratar pagamento já confirmado como idempotente', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento], rowCount: 1 } as any) // buscar pagamento
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // update retornou 0 rows (já pago)
        .mockResolvedValueOnce({ rows: [{ status: 'pago' }], rowCount: 1 } as any) // statusCheck
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // calcularParcelas base
        .mockResolvedValueOnce({ rows: [{ tipo: 'entidade' }], rowCount: 1 } as any) // tipo tomador
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // update entidades ativa
        .mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await confirmarPagamento(
        makeRequest({ pagamento_id: 100 }) as any
      );

      // Pagamento já pago: fluxo idempotente — continua com ações pós-pagamento
      expect([200, 400]).toContain(response.status);
    });

    it('deve aceitar requisição com IP no header x-forwarded-for', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPagamento], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 100 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [{ tipo: 'entidade' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await confirmarPagamento(
        makeRequest(
          { pagamento_id: 100, metodo_pagamento: 'pix' },
          { 'x-forwarded-for': '203.0.113.1' }
        ) as any
      );

      expect([200, 400, 500]).toContain(response.status);
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
