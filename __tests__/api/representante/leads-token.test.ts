/**
 * @fileoverview Testes da API POST /api/representante/leads/[id]/token
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { POST } from '@/app/api/representante/leads/[id]/token/route';
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

function makeReq() {
  return new NextRequest('http://localhost/api/representante/leads/5/token', {
    method: 'POST',
  });
}

describe('POST /api/representante/leads/[id]/token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(sess);
    mockErrResp.mockReturnValue({ status: 500, body: { error: 'Erro.' } });
  });

  it('deve retornar 400 para ID não numérico', async () => {
    const res = await POST(makeReq(), { params: { id: 'abc' } } as any);
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando lead não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST(makeReq(), { params: { id: '999' } } as any);
    expect(res.status).toBe(404);
  });

  it('deve retornar 403 quando lead pertence a outro rep', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, representante_id: 888, status: 'pendente' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '5' } } as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 409 quando lead não está pendente', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, representante_id: 1, status: 'convertido' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '5' } } as any);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/convertido/i);
  });

  it('deve gerar token e retornar link de convite', async () => {
    // lead check
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          representante_id: 1,
          status: 'pendente',
          data_expiracao: '2027-01-01',
        },
      ],
      rowCount: 1,
    } as any);
    // UPDATE RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [{ token_atual: 'abc123tkn', token_expiracao: '2026-06-01' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '5' } } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBe('abc123tkn');
    expect(data.link_convite).toContain('abc123tkn');
    expect(data.expira_em).toBeTruthy();
  });
});
