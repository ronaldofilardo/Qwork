/**
 * @fileoverview Testes da API POST /api/representante/vinculos/[id]/renovar
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { POST } from '@/app/api/representante/vinculos/[id]/renovar/route';
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
  return new NextRequest(
    'http://localhost/api/representante/vinculos/10/renovar',
    {
      method: 'POST',
    }
  );
}

describe('POST /api/representante/vinculos/[id]/renovar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(sess);
    mockErrResp.mockReturnValue({ status: 500, body: { error: 'Erro.' } });
  });

  it('deve retornar 400 para ID não numérico', async () => {
    const res = await POST(makeReq(), { params: { id: 'xyz' } } as any);
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando vínculo não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST(makeReq(), { params: { id: '999' } } as any);
    expect(res.status).toBe(404);
  });

  it('deve retornar 403 quando vínculo pertence a outro rep', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, representante_id: 888, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '10' } } as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 409 para vínculo encerrado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, representante_id: 1, status: 'encerrado' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '10' } } as any);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/encerrado/i);
  });

  it('deve retornar 409 para vínculo suspenso', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, representante_id: 1, status: 'suspenso' }],
      rowCount: 1,
    } as any);

    const res = await POST(makeReq(), { params: { id: '10' } } as any);
    expect(res.status).toBe(409);
  });

  it('deve renovar vínculo ativo por 1 ano', async () => {
    // buscar vínculo
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          representante_id: 1,
          status: 'ativo',
          entidade_nome: 'Empresa Y',
        },
      ],
      rowCount: 1,
    } as any);
    // UPDATE RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, status: 'ativo', data_expiracao: '2027-01-01' }],
      rowCount: 1,
    } as any);
    // auditoria INSERT
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(makeReq(), { params: { id: '10' } } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.mensagem).toMatch(/renovado/i);

    // 3 queries: select, update, audit
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('deve renovar vínculo inativo, passando para ativo', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, representante_id: 1, status: 'inativo' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 10, status: 'ativo', data_expiracao: '2027-06-01' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(makeReq(), { params: { id: '10' } } as any);
    expect(res.status).toBe(200);
    // Verifica status anterior = 'inativo' na auditoria
    const auditArgs = mockQuery.mock.calls[2][1];
    expect(auditArgs).toContain('inativo');
  });
});
