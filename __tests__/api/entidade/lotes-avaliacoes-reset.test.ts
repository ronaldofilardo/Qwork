/**
 * Testes para API /api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

import { POST } from '@/app/api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { NextRequest } from 'next/server';
import { QueryResult } from 'pg';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve rejeitar se usuario nao for gestor_entidade', async () => {
    mockRequireAuth.mockResolvedValue({
      perfil: 'funcionario',
      cpf: '22222222222',
    } as unknown);

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ reason: 'teste' }),
    });

    const res = await POST(req, {
      params: { id: '1', avaliacaoId: '2' },
    } as any);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Acesso negado');
  });

  it('deve rejeitar se lote nao pertence ao contratante', async () => {
    mockRequireAuth.mockResolvedValue({
      perfil: 'gestor_entidade',
      contratante_id: 99,
      cpf: '22222222222',
    } as unknown);

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>) // BEGIN
      .mockResolvedValueOnce({ rowCount: 0, rows: [] } as QueryResult<unknown>) // loteCheck
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>); // ROLLBACK

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ reason: 'teste' }),
    });

    const res = await POST(req, {
      params: { id: '1', avaliacaoId: '2' },
    } as { params: { id: string; avaliacaoId: string } });
    expect(res.status).toBe(404);
  });

  it('deve resetar com sucesso', async () => {
    mockRequireAuth.mockResolvedValue({
      perfil: 'gestor_entidade',
      contratante_id: 99,
      cpf: '22222222222',
      nome: 'Gestor',
    } as unknown);

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, empresa_id: 2, status: 'ativo', contratante_id: 99 }],
        rowCount: 1,
      } as QueryResult<unknown>) // loteCheck
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            status: 'em_andamento',
            funcionario_cpf: '33333333333',
            funcionario_nome: 'Nome',
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>) // avaliacaoCheck
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>) // reset check
      .mockResolvedValueOnce({
        rows: [{ count: '3' }],
        rowCount: 1,
      } as QueryResult<unknown>) // count respostas
      .mockResolvedValueOnce({ rows: [], rowCount: 3 } as QueryResult<unknown>) // delete
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as QueryResult<unknown>) // update avaliacao
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>) // requester select (no funcionario exists)

      .mockResolvedValueOnce({
        rows: [{ id: 'uuid-123', created_at: '2026-01-16T13:00:00Z' }],
        rowCount: 1,
      } as QueryResult<unknown>) // insert audit
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as QueryResult<unknown>); // COMMIT

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ reason: 'corrigir duplicidade' }),
    });

    const res = await POST(req, {
      params: { id: '1', avaliacaoId: '2' },
    } as { params: { id: string; avaliacaoId: string } });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.respostasDeleted).toBe(3);
  });
});
