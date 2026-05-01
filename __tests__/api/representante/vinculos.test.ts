/**
 * @fileoverview Testes da API GET /api/representante/vinculos
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { GET } from '@/app/api/representante/vinculos/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequire = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

const sess = {
  representante_id: 1,
  nome: 'Rep',
  email: 'r@t.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

function makeReq(params = '') {
  return new NextRequest(
    `http://localhost/api/representante/vinculos${params}`
  );
}

describe('GET /api/representante/vinculos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(sess);
    mockErrResp.mockReturnValue({ status: 500, body: { error: 'Erro.' } });
  });

  it('deve retornar 401 sem sessão', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado.' },
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('deve retornar lista de vínculos com campos agregados', async () => {
    const vinculo = {
      id: 1,
      entidade_nome: 'Empresa X',
      entidade_cnpj: '12345678000190',
      total_comissoes: '5',
      valor_total_pago: '1000.00',
      valor_pendente: '200.00',
      dias_para_expirar: 180,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [vinculo], rowCount: 1 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.vinculos).toHaveLength(1);
    expect(data.vinculos[0].valor_total_pago).toBe('1000.00');
    expect(data.vinculos[0].dias_para_expirar).toBe(180);
  });

  it('deve filtrar por status', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?status=ativo'));
    expect(res.status).toBe(200);
    expect(mockQuery.mock.calls[0][1]).toContain('ativo');
  });

  it('deve usar e.nome (não razao_social) e e.cnpj na query JOIN com entidades', async () => {
    const vinculo = {
      id: 1,
      entidade_nome: 'Empresa Correta',
      entidade_cnpj: '12345678000190',
      total_comissoes: '2',
      valor_total_pago: '800.00',
      valor_pendente: '100.00',
      dias_para_expirar: 60,
    };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [vinculo], rowCount: 1 } as any);

    await GET(makeReq());

    // A query de lista (2ª chamada) deve usar e.nome e nunca e.razao_social
    const listSQL = mockQuery.mock.calls[1][0] as string;
    expect(listSQL).toMatch(/e\.nome\s+AS\s+tomador_nome/i);
    expect(listSQL).toMatch(/e\.cnpj\s+AS\s+tomador_cnpj/i);
    expect(listSQL).not.toMatch(/e\.razao_social/i);
    // GROUP BY também deve usar e.nome
    expect(listSQL).toMatch(/GROUP BY\s+v\.id,\s*e\.nome,\s*e\.cnpj/i);
  });

  it('deve paginar resultados', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?page=2'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(2);
    const listParams = mockQuery.mock.calls[1][1];
    expect(listParams).toContain(20); // offset = (2-1)*20
  });
});
