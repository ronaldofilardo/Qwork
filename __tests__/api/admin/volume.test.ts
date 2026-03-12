/**
 * @file __tests__/api/admin/volume.test.ts
 * Testes: GET /api/admin/volume
 */

import { GET } from '@/app/api/admin/volume/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function makeReq(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/admin/volume');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as unknown as NextRequest;
}

describe('GET /api/admin/volume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '000',
      perfil: 'admin' as const,
    } as any);
  });

  it('403 se não admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('retorna dados de volume com entidades', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            data: '2025-01-10',
            liberadas: '5',
            concluidas: '3',
            inativadas: '1',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [{ id: '1', nome: 'Empresa A' }],
        rowCount: 1,
      } as any);

    const res = await GET(makeReq({ tipo: 'entidade', dias: '30' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.dados).toHaveLength(1);
    expect(json.dados[0].liberadas).toBe(5);
    expect(json.dados[0].taxa).toBe(60);
    expect(json.entidades).toHaveLength(1);
    expect(json.periodo_dias).toBe(30);
  });

  it('retorna dados tipo rh sem entidades', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq({ tipo: 'rh' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.entidades).toEqual([]);
  });

  it('limita dias entre 7 e 90', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq({ dias: '200' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.periodo_dias).toBe(90);
  });
});
