/**
 * @fileoverview Testes da API POST /api/admin/comissoes/vincular-representante
 * Cobre os fluxos com representante_id numérico (migration 1227):
 *  - Fluxo gestor:  body contém { representante_id, entidade_id }
 *  - Fluxo clínica: body contém { representante_id, clinica_id }
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');

import { POST } from '@/app/api/admin/comissoes/vincular-representante/route';
import { vincularRepresentantePorId } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockVincular = vincularRepresentantePorId as jest.MockedFunction<
  typeof vincularRepresentantePorId
>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeReq(body: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost/api/admin/comissoes/vincular-representante',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

const vinculoOk = {
  vinculo_id: 10,
  representante_id: 1,
  representante_nome: 'Rep Teste PJ',
};

describe('POST /api/admin/comissoes/vincular-representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
  });

  // ── Auth ────────────────────────────────────────────────────────────────
  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await POST(makeReq({ representante_id: 1, entidade_id: 1 }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para sem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await POST(makeReq({ representante_id: 1, entidade_id: 1 }));
    expect(res.status).toBe(403);
  });

  // ── Validação ────────────────────────────────────────────────────────────
  it('deve retornar 400 quando representante_id está ausente', async () => {
    const res = await POST(makeReq({ entidade_id: 1 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/representante_id/i);
  });

  it('deve retornar 400 quando nem entidade_id nem clinica_id fornecidos', async () => {
    const res = await POST(makeReq({ representante_id: 1 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/entidade_id ou clinica_id/i);
  });

  it('deve retornar 400 quando representante_id não é um número válido', async () => {
    const res = await POST(
      makeReq({ representante_id: 'abc', entidade_id: 1 })
    );
    expect(res.status).toBe(400);
  });

  // ── Fluxo gestor (entidade_id) ───────────────────────────────────────────
  it('deve vincular por entidade_id com sucesso', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    const res = await POST(makeReq({ representante_id: 1, entidade_id: 5 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.vinculo_id).toBe(10);
    expect(data.representante_nome).toBe('Rep Teste PJ');

    expect(mockVincular).toHaveBeenCalledWith(1, 5, undefined);
  });

  // ── Fluxo clínica pura (clinica_id) ─────────────────────────────────────
  it('deve vincular por clinica_id com sucesso', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    const res = await POST(makeReq({ representante_id: 1, clinica_id: 6 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.vinculo_id).toBe(10);

    expect(mockVincular).toHaveBeenCalledWith(1, undefined, 6);
  });

  // ── Representante não encontrado ─────────────────────────────────────────
  it('deve retornar 404 quando id não corresponde a nenhum representante', async () => {
    mockVincular.mockResolvedValue(null);

    const res = await POST(makeReq({ representante_id: 9999, entidade_id: 5 }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  // ── Ambos fornecidos ─────────────────────────────────────────────────────
  it('quando ambos fornecidos, passa ambos para vincularRepresentantePorId', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    await POST(makeReq({ representante_id: 1, entidade_id: 5, clinica_id: 6 }));

    const [, entArg, clinArg] = mockVincular.mock.calls[0];
    expect(entArg).toBe(5);
    expect(clinArg).toBe(6);
  });
});
