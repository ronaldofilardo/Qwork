/**
 * @fileoverview Testes da API POST /api/admin/comissoes/vincular-representante
 * Cobre os dois fluxos introduzidos na migration 504:
 *  - Fluxo gestor:  body contém { codigo, entidade_id }
 *  - Fluxo clínica: body contém { codigo, clinica_id }
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');

import { POST } from '@/app/api/admin/comissoes/vincular-representante/route';
import { vincularRepresentantePorCodigo } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockVincular = vincularRepresentantePorCodigo;
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
    const res = await POST(makeReq({ codigo: 'ABCD-1234', entidade_id: 1 }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para sem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await POST(makeReq({ codigo: 'ABCD-1234', entidade_id: 1 }));
    expect(res.status).toBe(403);
  });

  // ── Validação ────────────────────────────────────────────────────────────
  it('deve retornar 400 quando codigo está ausente', async () => {
    const res = await POST(makeReq({ entidade_id: 1 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/codigo/i);
  });

  it('deve retornar 400 quando nem entidade_id nem clinica_id fornecidos', async () => {
    const res = await POST(makeReq({ codigo: 'ABCD-1234' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/entidade_id ou clinica_id/i);
  });

  it('deve retornar 400 quando código é string vazia', async () => {
    const res = await POST(makeReq({ codigo: '   ', entidade_id: 1 }));
    expect(res.status).toBe(400);
  });

  // ── Fluxo gestor (entidade_id) ───────────────────────────────────────────
  it('deve vincular por entidade_id com sucesso', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    const res = await POST(makeReq({ codigo: 'ABCD-1234', entidade_id: 5 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.vinculo_id).toBe(10);
    expect(data.representante_nome).toBe('Rep Teste PJ');

    expect(mockVincular).toHaveBeenCalledWith('ABCD-1234', 5, undefined);
  });

  // ── Fluxo clínica pura (clinica_id) ─────────────────────────────────────
  it('deve vincular por clinica_id com sucesso', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    const res = await POST(makeReq({ codigo: 'ABCD-1234', clinica_id: 6 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.vinculo_id).toBe(10);

    expect(mockVincular).toHaveBeenCalledWith('ABCD-1234', undefined, 6);
  });

  // ── Representante não encontrado ─────────────────────────────────────────
  it('deve retornar 404 quando código não corresponde a nenhum representante', async () => {
    mockVincular.mockResolvedValue(null);

    const res = await POST(makeReq({ codigo: 'XXXX-9999', entidade_id: 5 }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  // ── Preferência: entidade_id tem prioridade sobre clinica_id ────────────
  it('quando ambos fornecidos, usa entidade_id', async () => {
    mockVincular.mockResolvedValue(vinculoOk);

    await POST(makeReq({ codigo: 'ABCD-1234', entidade_id: 5, clinica_id: 6 }));

    const [, entArg, clinArg] = mockVincular.mock.calls[0];
    expect(entArg).toBe(5);
    expect(clinArg).toBe(6);
  });
});
