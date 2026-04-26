/**
 * @fileoverview Testes da API PATCH /api/admin/comissoes/[id]
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');

import { PATCH } from '@/app/api/admin/comissoes/[id]/route';
import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockAuditoria = registrarAuditoria as jest.MockedFunction<
  typeof registrarAuditoria
>;

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/comissoes/1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockComissao(
  status: string,
  extraFields: Record<string, unknown> = {}
) {
  mockQuery.mockResolvedValueOnce({
    rows: [
      {
        id: 1,
        status,
        representante_id: 1,
        representante_nome: 'Rep Teste',
        valor_comissao: '500.00',
        ...extraFields,
      },
    ],
    rowCount: 1,
  } as any);
}

describe('PATCH /api/admin/comissoes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    mockAuditoria.mockResolvedValue(undefined as any);
  });

  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await PATCH(makeReq({ acao: 'liberar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 para ID inválido', async () => {
    const res = await PATCH(makeReq({ acao: 'liberar' }), {
      params: { id: 'xyz' },
    } as any);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 para ação inválida', async () => {
    const res = await PATCH(makeReq({ acao: 'explodir' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/ação inválida/i);
  });

  it('deve retornar 404 quando comissão não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await PATCH(makeReq({ acao: 'cancelar' }), {
      params: { id: '999' },
    } as any);
    expect(res.status).toBe(404);
  });

  // --- Ação: congelar ---
  it('deve congelar comissão retida com motivo', async () => {
    mockComissao('retida');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'congelada_aguardando_admin' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeReq({ acao: 'congelar', motivo: 'Verificação pendente' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
  });

  it('deve retornar 422 ao tentar congelar comissão paga', async () => {
    mockComissao('paga');
    const res = await PATCH(
      makeReq({ acao: 'congelar', motivo: 'Verificação' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(422);
  });

  // --- Ação: pagar ---
  it('deve pagar comissão liberada', async () => {
    mockComissao('liberada');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'paga' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeReq({ acao: 'pagar', comprovante_path: '/comprovantes/abc.pdf' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
    // Verifica comprovante no UPDATE
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1]).toContain('/comprovantes/abc.pdf');
  });

  it('deve retornar 422 ao tentar pagar comissão aprovada', async () => {
    mockComissao('aprovada');
    const res = await PATCH(makeReq({ acao: 'pagar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(422);
  });

  it('deve retornar 400 ao congelar sem motivo', async () => {
    mockComissao('retida');
    const res = await PATCH(makeReq({ acao: 'congelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/motivo/i);
  });

  // --- Ação: cancelar ---
  it('deve cancelar comissão retida', async () => {
    mockComissao('retida');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'cancelada' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(makeReq({ acao: 'cancelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comissao.status).toBe('cancelada');
  });

  it('deve cancelar comissão congelada', async () => {
    mockComissao('congelada_aguardando_admin');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'cancelada' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(makeReq({ acao: 'cancelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(200);
  });

  it('deve retornar 422 ao tentar cancelar comissão paga', async () => {
    mockComissao('paga');
    const res = await PATCH(makeReq({ acao: 'cancelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(422);
  });

  // --- Ação: descongelar ---
  it('deve descongelar comissão congelada_aguardando_admin', async () => {
    mockComissao('congelada_aguardando_admin');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'aprovada' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(makeReq({ acao: 'descongelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comissao.status).toBe('aprovada');
  });

  it('deve retornar 422 ao descongelar comissão congelada_rep_suspenso', async () => {
    mockComissao('congelada_rep_suspenso');
    const res = await PATCH(makeReq({ acao: 'descongelar' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(422);
  });
});
