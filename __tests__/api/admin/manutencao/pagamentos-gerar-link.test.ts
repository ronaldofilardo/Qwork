/**
 * @fileoverview Testes POST /api/admin/manutencao/pagamentos/[pagamentoId]/gerar-link
 * @description Gera token UUID e link de pagamento de manutenção
 */

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/manutencao/pagamentos/[pagamentoId]/gerar-link/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/admin/manutencao/pagamentos/${id}/gerar-link`,
    { method: 'POST' }
  );
}

describe('POST /api/admin/manutencao/pagamentos/[pagamentoId]/gerar-link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401/403 quando requireRole lança erro', async () => {
    mockRequireRole.mockRejectedValueOnce({ status: 401, message: 'Não autorizado' });
    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 para pagamentoId NaN', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    const res = await POST(makeRequest('abc'), { params: { pagamentoId: 'abc' } });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando pagamento não encontrado', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeRequest('99'), { params: { pagamentoId: '99' } });
    expect(res.status).toBe(404);
  });

  it('deve retornar 400 quando pagamento já pago', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, status: 'pago', valor: '250.00', tipo_cobranca: 'manutencao', nome: 'Entidade A' }],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(400);
  });

  it('deve gerar token e retornar link quando pagamento válido', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 5, status: 'pendente', valor: '250.00', tipo_cobranca: 'manutencao', nome: 'Entidade A' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBe('mock-uuid-1234');
    expect(body.link_pagamento).toContain('/pagamento/manutencao/mock-uuid-1234');
    expect(body.valor).toBe(250);
    expect(body.nome).toBe('Entidade A');
  });
});
