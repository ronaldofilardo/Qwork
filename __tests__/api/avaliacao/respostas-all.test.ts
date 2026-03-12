/**
 * @file __tests__/api/avaliacao/respostas-all.test.ts
 * Testes: GET /api/avaliacao/respostas-all
 */

import { GET } from '@/app/api/avaliacao/respostas-all/route';
import { requireAuth } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

jest.mock('@/lib/session');
jest.mock('@/lib/db-security');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQueryCtx = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;

function makeReq(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/avaliacao/respostas-all');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as unknown as Request;
}

describe('GET /api/avaliacao/respostas-all', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
  });

  it('retorna respostas para avaliacaoId específico', async () => {
    mockQueryCtx
      .mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 } as any) // check ownership
      .mockResolvedValueOnce({
        rows: [
          { item: 'Q1', valor: 3 },
          { item: 'Q2', valor: 5 },
        ],
        rowCount: 2,
      } as any);

    const res = await GET(makeReq({ avaliacaoId: '5' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avaliacaoId).toBe(5);
    expect(json.respostas).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it('retorna vazio se avaliacaoId não pertence ao user', async () => {
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeReq({ avaliacaoId: '99' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.respostas).toEqual([]);
    expect(json.total).toBe(0);
  });

  it('busca avaliação ativa se avaliacaoId não fornecido', async () => {
    mockQueryCtx
      .mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any) // active avaliacao
      .mockResolvedValueOnce({
        rows: [{ item: 'Q1', valor: 2 }],
        rowCount: 1,
      } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.avaliacaoId).toBe(10);
    expect(json.total).toBe(1);
  });

  it('retorna vazio se nenhuma avaliação ativa', async () => {
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.respostas).toEqual([]);
  });

  it('500 em caso de erro', async () => {
    mockRequireAuth.mockRejectedValue(new Error('fail'));
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
