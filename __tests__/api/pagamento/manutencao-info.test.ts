/**
 * @fileoverview Testes GET /api/pagamento/manutencao/[token]/info
 * @description Endpoint público para carregar dados de pagamento de manutenção pelo token
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/pagamento/manutencao/[token]/info/route';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeRequest(token: string) {
  return new NextRequest(
    `http://localhost/api/pagamento/manutencao/${token}/info`,
    { method: 'GET' }
  );
}

describe('GET /api/pagamento/manutencao/[token]/info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 400 para token vazio', async () => {
    const res = await GET(makeRequest(''), { params: { token: '' } });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando token não encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeRequest('invalid-tok'), {
      params: { token: 'invalid-tok' },
    });
    expect(res.status).toBe(404);
  });

  it('deve retornar 410 quando pagamento já está pago', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pagamento_id: 5,
          entidade_id: 1,
          empresa_id: null,
          valor: '250.00',
          status: 'pago',
          link_pagamento_enviado_em: '2026-04-01T00:00:00Z',
          nome: 'Entidade Paga',
          cnpj: '12345678000100',
          clinica_nome: null,
          entidade_id_check: 1,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(makeRequest('tok-pago'), {
      params: { token: 'tok-pago' },
    });
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.already_paid).toBe(true);
  });

  it('deve retornar dados completos de entidade quando token válido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pagamento_id: 10,
          entidade_id: 5,
          empresa_id: null,
          valor: '250.00',
          status: 'aguardando_pagamento',
          link_pagamento_enviado_em: '2026-04-02T00:00:00Z',
          nome: 'Entidade Teste',
          cnpj: '12345678000100',
          clinica_nome: null,
          entidade_id_check: 5,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(makeRequest('tok-valido'), {
      params: { token: 'tok-valido' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagamento_id).toBe(10);
    expect(body.tomador_id).toBe(5);
    expect(body.valor).toBe(250);
    expect(body.nome).toBe('Entidade Teste');
    expect(body.cnpj).toBe('12345678000100');
    expect(body.clinica_nome).toBeNull();
  });

  it('deve retornar dados de empresa_clinica com tomador_id = empresa_id', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pagamento_id: 20,
          entidade_id: null,
          empresa_id: 8,
          valor: '250.00',
          status: 'pendente',
          link_pagamento_enviado_em: '2026-04-03T00:00:00Z',
          nome: 'Empresa XYZ',
          cnpj: '98765432000100',
          clinica_nome: 'Clínica Mestre',
          entidade_id_check: null,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(makeRequest('tok-empresa'), {
      params: { token: 'tok-empresa' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tomador_id).toBe(8);
    expect(body.clinica_nome).toBe('Clínica Mestre');
  });
});
