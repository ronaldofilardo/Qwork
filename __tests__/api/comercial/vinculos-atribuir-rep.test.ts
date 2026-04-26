/**
 * @file __tests__/api/comercial/vinculos-atribuir-rep.test.ts
 *
 * Testes para PATCH /api/comercial/vinculos/[id]/atribuir-rep
 * Covers: autenticação, validações, valor_negociado, conflitos.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Comercial',
    perfil: 'comercial',
  }),
}));

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/comercial/vinculos/[id]/atribuir-rep/route';

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeReq(body: unknown, id = '42'): [NextRequest, { params: { id: string } }] {
  const req = new NextRequest('http://localhost/api/comercial/vinculos/42/atribuir-rep', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: { id } }];
}

describe('PATCH /api/comercial/vinculos/[id]/atribuir-rep', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 400 para ID inválido', async () => {
    const [req, ctx] = makeReq({ representante_id: 1 }, 'abc');
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('ID inválido');
  });

  it('retorna 400 se schema inválido (representante_id ausente)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42, representante_id: null, status: 'ativo' }] } as never);
    const [req, ctx] = makeReq({ obs: 'teste' });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Dados inválidos');
  });

  it('retorna 404 quando vínculo não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando vínculo já tem representante', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, representante_id: 3, status: 'ativo' }],
    } as never);
    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(409);
  });

  it('retorna 422 quando vínculo está encerrado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, representante_id: null, status: 'encerrado' }],
    } as never);
    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('encerrado');
  });

  it('retorna 404 quando representante não existe', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, representante_id: null, status: 'ativo' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never); // rep not found
    const [req, ctx] = makeReq({ representante_id: 999 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('Representante não encontrado');
  });

  it('retorna 422 quando representante não está apto', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, representante_id: null, status: 'ativo' }] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 5, status: 'inativo', modelo_comissionamento: 'percentual' }] } as never);
    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('apto');
  });

  it('vincula representante com sucesso (modelo percentual, sem valor_negociado)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, representante_id: null, status: 'ativo' }] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 5, status: 'apto', modelo_comissionamento: 'percentual' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never) // UPDATE vinculos_comissao
      .mockResolvedValueOnce({ rows: [] } as never); // INSERT auditoria

    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    // Verifica UPDATE com valor_negociado = null
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE($2, valor_negociado)'),
      [5, null, 42]
    );
  });

  it('vincula representante com sucesso passando valor_negociado (modelo custo_fixo)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, representante_id: null, status: 'ativo' }] } as never)
      .mockResolvedValueOnce({ rows: [{ id: 5, status: 'apto', modelo_comissionamento: 'custo_fixo' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never) // UPDATE vinculos_comissao
      .mockResolvedValueOnce({ rows: [] } as never); // INSERT auditoria

    const [req, ctx] = makeReq({ representante_id: 5, valor_negociado: 120.5 });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE($2, valor_negociado)'),
      [5, 120.5, 42]
    );
  });

  it('retorna 400 quando valor_negociado é negativo', async () => {
    const [req, ctx] = makeReq({ representante_id: 5, valor_negociado: -10 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Dados inválidos');
  });

  it('retorna 403 quando não autenticado', async () => {
    const { requireRole } = await import('@/lib/session');
    (requireRole as jest.Mock).mockRejectedValueOnce(new Error('Não autenticado'));

    const [req, ctx] = makeReq({ representante_id: 5 });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(403);
  });
});
