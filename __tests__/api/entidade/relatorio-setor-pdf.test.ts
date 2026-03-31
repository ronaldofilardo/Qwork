/**
 * @file __tests__/api/entidade/relatorio-setor-pdf.test.ts
 * Testes: GET /api/entidade/relatorio-setor-pdf
 */

import { GET } from '@/app/api/entidade/relatorio-setor-pdf/route';
import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/pdf/relatorio-setor', () => ({
  gerarRelatorioSetorPDF: jest.fn().mockReturnValue(Buffer.from('%PDF')),
}));

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeReq(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/entidade/relatorio-setor-pdf');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as unknown as NextRequest;
}

describe('GET /api/entidade/relatorio-setor-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue({
      cpf: '111',
      perfil: 'gestor',
      entidade_id: 5,
    } as any);
  });

  it('400 se lote_id ou setor ausente', async () => {
    const res = await GET(makeReq({ lote_id: '1' }));
    expect(res.status).toBe(400);
  });

  it('404 se lote não pertence à entidade', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeReq({ lote_id: '1', setor: 'TI' }));
    expect(res.status).toBe(404);
  });

  it('200 retorna PDF binário', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, empresa_nome: 'Empresa X' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: 5 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{ grupo: 'G1', valor: '3.50' }],
        rowCount: 1,
      } as any);

    const res = await GET(makeReq({ lote_id: '1', setor: 'TI' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('500 em erro de auth', async () => {
    mockRequireEntity.mockRejectedValue(new Error('fail'));
    const res = await GET(makeReq({ lote_id: '1', setor: 'TI' }));
    expect(res.status).toBe(500);
  });
});
