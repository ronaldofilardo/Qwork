/**
 * @fileoverview Testes da API PATCH /api/admin/representantes/[id]/status
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');

import { PATCH } from '@/app/api/admin/representantes/[id]/status/route';
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
  return new NextRequest('http://localhost/api/admin/representantes/1/status', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PATCH /api/admin/representantes/[id]/status', () => {
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
    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para não admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 para ID inválido', async () => {
    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: 'abc' },
    } as any);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 para status inexistente', async () => {
    const res = await PATCH(makeReq({ novo_status: 'invalido' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando rep não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: '999' },
    } as any);
    expect(res.status).toBe(404);
  });

  it('deve retornar 422 para transição inválida (desativado → apto)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'desativado', nome: 'Rep' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/transição inválida/i);
  });

  it('deve aprovar: ativo → apto_pendente', async () => {
    // buscar rep
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    // UPDATE RETURNING
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto_pendente' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeReq({ novo_status: 'apto_pendente', motivo: 'Aprovação inicial' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        tabela: 'representantes',
        registro_id: 1,
        status_anterior: 'ativo',
        status_novo: 'apto_pendente',
      })
    );
  });

  it('deve aprovar como apto e liberar comissões retidas', async () => {
    // buscar rep (apto_pendente → apto)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto_pendente', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    // UPDATE rep
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto' }],
      rowCount: 1,
    } as any);
    // liberar comissões retidas
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 3 } as any);
    // atualizar dados_bancarios_status
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await PATCH(makeReq({ novo_status: 'apto' }), {
      params: { id: '1' },
    } as any);
    expect(res.status).toBe(200);
    // Verifica que comissões retidas foram liberadas
    expect(mockQuery).toHaveBeenCalledTimes(4);
    const liberarCall = mockQuery.mock.calls[2][0];
    expect(liberarCall).toContain("status = 'liberada'");
    expect(liberarCall).toContain("status = 'retida'");
  });

  it('deve suspender: congelar comissões e suspender vínculos', async () => {
    // buscar rep (apto → suspenso)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    // UPDATE rep
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'suspenso' }],
      rowCount: 1,
    } as any);
    // congelar comissões
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 } as any);
    // suspender vínculos
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await PATCH(
      makeReq({ novo_status: 'suspenso', motivo: 'Investigação' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
    // 4 queries: select, update rep, congelar comissões, suspender vínculos
    expect(mockQuery).toHaveBeenCalledTimes(4);
  });

  it('deve desativar: encerrar vínculos e cancelar comissões', async () => {
    // buscar rep (apto → desativado)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    // UPDATE rep
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'desativado' }],
      rowCount: 1,
    } as any);
    // encerrar vínculos
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 } as any);
    // cancelar comissões
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 3 } as any);

    const res = await PATCH(
      makeReq({ novo_status: 'desativado', motivo: 'Fraude' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(4);
    const encerrarCall = mockQuery.mock.calls[2][0];
    expect(encerrarCall).toContain("status = 'encerrado'");
  });

  it('deve restaurar suspenso → apto: reativar vínculos e comissões', async () => {
    // buscar rep (suspenso → apto)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'suspenso', nome: 'Rep' }],
      rowCount: 1,
    } as any);
    // UPDATE rep
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'apto' }],
      rowCount: 1,
    } as any);
    // liberar comissões retidas (novo_status === 'apto' branch)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // atualizar dados_bancarios_status (novo_status === 'apto' branch)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // reativar vínculos (statusAtual === 'suspenso' branch)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // restaurar comissões congeladas
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 } as any);

    const res = await PATCH(
      makeReq({ novo_status: 'apto', motivo: 'Investigação concluída' }),
      { params: { id: '1' } } as any
    );
    expect(res.status).toBe(200);
    // 6 queries: select, update rep, liberar retidas, dados_bancarios, reativar vínculos, restaurar congeladas
    expect(mockQuery).toHaveBeenCalledTimes(6);
  });
});
