/**
 * @file __tests__/api/avaliacao/check-sync.test.ts
 * Testes: POST /api/avaliacao/check-sync
 */

import { POST } from '@/app/api/avaliacao/check-sync/route';
import { getSession } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

jest.mock('@/lib/session');
jest.mock('@/lib/db-security');
jest.mock('@/lib/structured-logger', () => ({
  StructuredLogger: { logError: jest.fn() },
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQueryCtx = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;

function makeReq(body: Record<string, unknown>): Request {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as Request;
}

describe('POST /api/avaliacao/check-sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 se não autenticado', async () => {
    mockGetSession.mockReturnValue(null as any);
    const res = await POST(
      makeReq({ grupo: 1, timestamp: '2025-01-01T00:00:00Z' })
    );
    expect(res.status).toBe(401);
  });

  it('400 se grupo ou timestamp ausente', async () => {
    mockGetSession.mockReturnValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
    const res = await POST(makeReq({ grupo: 1 }));
    expect(res.status).toBe(400);
  });

  it('retorna alreadySynced=true se timestamp próximo (< 5min)', async () => {
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
    mockGetSession.mockReturnValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
    mockQueryCtx.mockResolvedValueOnce({
      rows: [{ id: 42, inicio: twoMinAgo.toISOString() }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq({ grupo: 1, timestamp: now.toISOString() }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alreadySynced).toBe(true);
    expect(json.avaliacaoId).toBe(42);
  });

  it('retorna alreadySynced=false se timestamp distante', async () => {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    mockGetSession.mockReturnValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
    mockQueryCtx.mockResolvedValueOnce({
      rows: [{ id: 42, inicio: tenMinAgo.toISOString() }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq({ grupo: 1, timestamp: now.toISOString() }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alreadySynced).toBe(false);
  });

  it('retorna alreadySynced=false se nenhuma avaliação encontrada', async () => {
    mockGetSession.mockReturnValue({
      cpf: '111',
      perfil: 'funcionario',
    } as any);
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST(
      makeReq({ grupo: 1, timestamp: '2025-01-01T00:00:00Z' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alreadySynced).toBe(false);
  });
});
