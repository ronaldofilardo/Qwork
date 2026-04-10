/**
 * @fileoverview Testes POST /api/admin/manutencao/pagamentos/[pagamentoId]/verificar
 * @description Consulta Asaas e confirma pagamento de manutenção se aprovado
 */

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/asaas/client', () => ({
  asaasClient: {
    getPayment: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/manutencao/pagamentos/[pagamentoId]/verificar/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetPayment = asaasClient.getPayment as jest.MockedFunction<
  typeof asaasClient.getPayment
>;

function makeRequest(id: string) {
  return new NextRequest(
    `http://localhost/api/admin/manutencao/pagamentos/${id}/verificar`,
    { method: 'POST' }
  );
}

describe('POST /api/admin/manutencao/pagamentos/[pagamentoId]/verificar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 400 para pagamentoId NaN', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    const res = await POST(makeRequest('abc'), {
      params: { pagamentoId: 'abc' },
    });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando pagamento não encontrado', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeRequest('99'), {
      params: { pagamentoId: '99' },
    });
    expect(res.status).toBe(404);
  });

  it('deve retornar synced=false quando pagamento já está pago no banco', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          status: 'pago',
          asaas_payment_id: 'pay_123',
          valor: '250.00',
          nome: 'Entidade A',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pago');
    expect(body.synced).toBe(false);
  });

  it('deve retornar synced=false quando não há asaas_payment_id', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          status: 'aguardando_pagamento',
          asaas_payment_id: null,
          valor: '250.00',
          nome: 'Entidade A',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(false);
    expect(body.message).toContain('Nenhuma cobrança Asaas');
  });

  it('deve retornar 502 quando Asaas lança erro', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          status: 'aguardando_pagamento',
          asaas_payment_id: 'pay_err',
          valor: '250.00',
          nome: 'X',
        },
      ],
      rowCount: 1,
    } as any);
    mockGetPayment.mockRejectedValueOnce(new Error('timeout'));

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(502);
  });

  it('deve confirmar pagamento quando Asaas retorna CONFIRMED', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            status: 'aguardando_pagamento',
            asaas_payment_id: 'pay_ok',
            valor: '250.00',
            nome: 'Entidade A',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE
    mockGetPayment.mockResolvedValueOnce({ status: 'CONFIRMED' } as any);

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(true);
    expect(body.status).toBe('pago');
  });

  it('deve retornar synced=false quando Asaas retorna PENDING', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '000',
      perfil: 'admin',
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          status: 'aguardando_pagamento',
          asaas_payment_id: 'pay_pend',
          valor: '250.00',
          nome: 'X',
        },
      ],
      rowCount: 1,
    } as any);
    mockGetPayment.mockResolvedValueOnce({ status: 'PENDING' } as any);

    const res = await POST(makeRequest('5'), { params: { pagamentoId: '5' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(false);
    expect(body.message).toContain('PENDING');
  });
});
