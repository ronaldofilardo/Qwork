/**
 * @fileoverview Testes da API GET /api/admin/representantes
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { GET } from '@/app/api/admin/representantes/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeReq(params = '') {
  return new NextRequest(`http://localhost/api/admin/representantes${params}`);
}

describe('GET /api/admin/representantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
  });

  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para não admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('deve retornar lista de representantes com aggregados', async () => {
    const rep = {
      id: 1,
      nome: 'Carlos Rep',
      email: 'rep@test.dev',
      codigo: 'AB12-CD34',
      status: 'apto',
      tipo_pessoa: 'pf',
      total_leads: '3',
      leads_convertidos: '1',
      total_vinculos: '2',
      vinculos_ativos: '2',
      total_comissoes: '10',
      valor_total_pago: '5000.00',
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any) // count
      .mockResolvedValueOnce({ rows: [rep], rowCount: 1 } as any); // list

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representantes).toHaveLength(1);
    expect(data.representantes[0].total_leads).toBe('3');
    expect(data.total).toBe(1);
  });

  it('deve filtrar por status', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?status=suspenso'));
    expect(res.status).toBe(200);
    expect(mockQuery.mock.calls[0][1]).toContain('suspenso');
  });

  it('deve filtrar por busca (nome/email/codigo)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?busca=carlos'));
    expect(res.status).toBe(200);
    expect(mockQuery.mock.calls[0][1]).toContain('%carlos%');
  });

  it('deve paginar resultados (limit=30)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?page=2'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(2);
    expect(data.limit).toBe(30);
    const listParams = mockQuery.mock.calls[1][1];
    expect(listParams).toContain(30); // offset = (2-1)*30
  });

  it('deve incluir percentual_comissao na query SQL', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq());
    const sql = mockQuery.mock.calls[1][0] as string;
    expect(sql).toContain('percentual_comissao');
  });

  it('deve retornar percentual_comissao quando definido para o representante', async () => {
    const repComComissao = {
      id: 2,
      nome: 'Ana Rep',
      email: 'ana@test.dev',
      codigo: 'XX99-YY11',
      status: 'ativo',
      tipo_pessoa: 'pj',
      total_leads: '5',
      leads_convertidos: '2',
      vinculos_ativos: '3',
      valor_total_pago: '12000.00',
      percentual_comissao: '7.50',
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [repComComissao], rowCount: 1 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representantes[0].percentual_comissao).toBe('7.50');
  });

  it('deve retornar null para percentual_comissao quando não definido', async () => {
    const repSemComissao = {
      id: 3,
      nome: 'João Rep',
      email: 'joao@test.dev',
      codigo: 'ZZ00-WW22',
      status: 'apto',
      tipo_pessoa: 'pf',
      total_leads: '1',
      leads_convertidos: '0',
      vinculos_ativos: '0',
      valor_total_pago: '0.00',
      percentual_comissao: null,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [repSemComissao], rowCount: 1 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representantes[0].percentual_comissao).toBeNull();
  });
});
