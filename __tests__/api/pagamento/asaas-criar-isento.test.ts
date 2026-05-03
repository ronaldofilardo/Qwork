import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pagamento/asaas/criar/route';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/asaas/client', () => ({
  asaasClient: {
    isConfigured: jest.fn(() => true),
    createCustomer: jest.fn(),
    createPayment: jest.fn(),
  },
}));

describe('POST /api/pagamento/asaas/criar — tomador isento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna payload de isenção e não chama o Asaas quando o tomador é isento', async () => {
    (query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            nome: 'Tomador Isento SA',
            tipo: 'entidade',
            entidade_cnpj: '11222333000100',
            entidade_email: 'financeiro@teste.com',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ isento_pagamento: true }] });

    const req = new NextRequest('http://localhost/api/pagamento/asaas/criar', {
      method: 'POST',
      body: JSON.stringify({
        tomador_id: 10,
        valor_total: 100,
        metodo: 'PIX',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      isento: true,
      message: 'Tomador isento de pagamento',
    });
    expect(asaasClient.createCustomer).not.toHaveBeenCalled();
    expect(asaasClient.createPayment).not.toHaveBeenCalled();
  });
});
