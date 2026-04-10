/**
 * @fileoverview Testes POST /api/admin/manutencao/pagamentos/[pagamentoId]/disponibilizar
 * @description Marca link_disponibilizado_em e cria notificação para o tomador
 */

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/manutencao/pagamentos/[pagamentoId]/disponibilizar/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/admin/manutencao/pagamentos/${id}/disponibilizar`,
    { method: 'POST' }
  );
}

const pagamentoBase = {
  id: 10,
  status: 'aguardando_pagamento',
  valor: '250.00',
  tipo_cobranca: 'manutencao',
  link_pagamento_token: 'tok-abc-123',
  link_disponibilizado_em: null,
  entidade_id: 5,
  empresa_id: null,
  nome: 'Entidade Teste',
  responsavel_cpf: '12345678900',
};

describe('POST /api/admin/manutencao/pagamentos/[pagamentoId]/disponibilizar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';
  });

  it('deve retornar 401/403 quando requireRole lança erro', async () => {
    mockRequireRole.mockRejectedValueOnce({ status: 403, message: 'Acesso restrito' });
    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 para pagamentoId NaN', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    const res = await POST(makeRequest('xyz'), { params: { pagamentoId: 'xyz' } });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando pagamento não encontrado', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeRequest('99'), { params: { pagamentoId: '99' } });
    expect(res.status).toBe(404);
  });

  it('deve retornar 400 quando link não gerado ainda', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...pagamentoBase, link_pagamento_token: null }],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Gere o link primeiro');
  });

  it('deve retornar 400 quando pagamento já pago', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...pagamentoBase, status: 'pago' }],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    expect(res.status).toBe(400);
  });

  it('deve retornar 409 quando link já disponibilizado', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: '000', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...pagamentoBase, link_disponibilizado_em: '2026-04-01T10:00:00Z' }],
      rowCount: 1,
    } as any);
    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    expect(res.status).toBe(409);
  });

  it('deve disponibilizar link e criar notificação com sucesso', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: 'admin-cpf', perfil: 'admin' } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [pagamentoBase], rowCount: 1 } as any) // SELECT
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)              // UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);             // INSERT notificacao

    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pagamento_id).toBe(10);
    expect(body.link_disponibilizado_em).toBeDefined();
  });

  it('deve disponibilizar link mesmo quando INSERT de notificação falha', async () => {
    mockRequireRole.mockResolvedValueOnce({ cpf: 'admin-cpf', perfil: 'admin' } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [pagamentoBase], rowCount: 1 } as any) // SELECT
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)              // UPDATE
      .mockRejectedValueOnce(new Error('DB error notif'));                   // INSERT falha

    const res = await POST(makeRequest('10'), { params: { pagamentoId: '10' } });
    // Notificação é não-bloqueante, portanto ainda retorna 200
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
