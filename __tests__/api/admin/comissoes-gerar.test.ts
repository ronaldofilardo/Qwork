/**
 * @fileoverview Testes da API POST /api/admin/comissoes/gerar
 * Cobre os dois fluxos introduzidos nas migrations 504/505:
 *  - Fluxo gestor:  body contém { ..., entidade_id }
 *  - Fluxo clínica: body contém { ..., clinica_id }
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/db/comissionamento');

import { POST } from '@/app/api/admin/comissoes/gerar/route';
import { criarComissaoAdmin } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCriar = criarComissaoAdmin;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

const BASE_BODY = {
  lote_pagamento_id: 24,
  vinculo_id: 2,
  representante_id: 1,
  valor_laudo: 45.0,
};

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/comissoes/gerar', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const comissaoGerada = {
  id: 7,
  status: 'aprovada',
  valor_comissao: '13.50',
  percentual_comissao: '30.00',
};

describe('POST /api/admin/comissoes/gerar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
    // Mock DB guards: lote pago + sem duplicata
    mockQuery
      .mockResolvedValueOnce({ rows: [{ status_pagamento: 'pago' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
  });

  // ── Auth ────────────────────────────────────────────────────────────────
  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para sem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(403);
  });

  // ── Validação ────────────────────────────────────────────────────────────
  it('deve retornar 400 quando lote_pagamento_id ausente', async () => {
    const res = await POST(
      makeReq({
        vinculo_id: 2,
        representante_id: 1,
        valor_laudo: 45,
        entidade_id: 5,
      })
    );
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando valor_laudo é zero', async () => {
    const res = await POST(
      makeReq({ ...BASE_BODY, valor_laudo: 0, entidade_id: 5 })
    );
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando valor_laudo é negativo', async () => {
    const res = await POST(
      makeReq({ ...BASE_BODY, valor_laudo: -10, entidade_id: 5 })
    );
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando valor_laudo não é número', async () => {
    const res = await POST(
      makeReq({ ...BASE_BODY, valor_laudo: 'cem', entidade_id: 5 })
    );
    expect(res.status).toBe(400);
  });

  // ── Fluxo gestor (entidade_id) ───────────────────────────────────────────
  it('deve gerar comissão por entidade_id com sucesso', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.comissao.id).toBe(7);

    expect(mockCriar).toHaveBeenCalledWith(
      expect.objectContaining({
        lote_pagamento_id: 24,
        vinculo_id: 2,
        representante_id: 1,
        entidade_id: 5,
        clinica_id: null,
        valor_laudo: 45.0,
      })
    );
  });

  // ── Fluxo clínica pura (clinica_id) ─────────────────────────────────────
  it('deve gerar comissão por clinica_id com sucesso', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const res = await POST(makeReq({ ...BASE_BODY, clinica_id: 6 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockCriar).toHaveBeenCalledWith(
      expect.objectContaining({
        entidade_id: null,
        clinica_id: 6,
      })
    );
  });

  // ── Sem entidade nem clínica ─────────────────────────────────────────────
  it('deve retornar 422 quando criarComissaoAdmin retorna erro', async () => {
    mockCriar.mockResolvedValue({
      comissao: null,
      erro: 'É necessário informar entidade_id ou clinica_id para gerar comissão.',
    });

    const res = await POST(makeReq({ ...BASE_BODY }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/entidade_id ou clinica_id/i);
  });

  // ── Erros de negócio ─────────────────────────────────────────────────────
  it('deve retornar 422 quando percentual não definido', async () => {
    mockCriar.mockResolvedValue({
      comissao: null,
      erro: 'Percentual de comissão não definido para este representante.',
    });

    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/percentual/i);
  });

  it('deve retornar 422 quando comissão já gerada', async () => {
    mockCriar.mockResolvedValue({
      comissao: null,
      erro: 'Comissão já gerada para este lote e representante.',
    });

    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/já gerada/i);
  });

  // ── laudo_id opcional ─────────────────────────────────────────────────────
  it('deve aceitar ausência de laudo_id (laudo opcional)', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const res = await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    expect(res.status).toBe(200);

    expect(mockCriar).toHaveBeenCalledWith(
      expect.objectContaining({ laudo_id: null })
    );
  });

  it('deve passar laudo_id quando fornecido', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const res = await POST(
      makeReq({ ...BASE_BODY, entidade_id: 5, laudo_id: 24 })
    );
    expect(res.status).toBe(200);

    expect(mockCriar).toHaveBeenCalledWith(
      expect.objectContaining({ laudo_id: 24 })
    );
  });

  // ── parcela_confirmada_em (migration 532) ─────────────────────────────────
  it('deve sempre passar parcela_confirmada_em como Date quando admin gera manualmente', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const antes = new Date();
    await POST(makeReq({ ...BASE_BODY, entidade_id: 5 }));
    const depois = new Date();

    const chamada = (mockCriar as jest.Mock).mock.calls[0][0];
    expect(chamada.parcela_confirmada_em).toBeInstanceOf(Date);
    expect(chamada.parcela_confirmada_em.getTime()).toBeGreaterThanOrEqual(
      antes.getTime()
    );
    expect(chamada.parcela_confirmada_em.getTime()).toBeLessThanOrEqual(
      depois.getTime()
    );
  });

  it('deve passar parcela_numero e total_parcelas quando fornecidos', async () => {
    mockCriar.mockResolvedValue({ comissao: comissaoGerada });

    const res = await POST(
      makeReq({
        ...BASE_BODY,
        entidade_id: 5,
        parcela_numero: 2,
        total_parcelas: 3,
      })
    );
    expect(res.status).toBe(200);

    expect(mockCriar).toHaveBeenCalledWith(
      expect.objectContaining({ parcela_numero: 2, total_parcelas: 3 })
    );
  });

  it('deve retornar 400 quando parcela_numero > total_parcelas', async () => {
    const res = await POST(
      makeReq({
        ...BASE_BODY,
        entidade_id: 5,
        parcela_numero: 4,
        total_parcelas: 3,
      })
    );
    expect(res.status).toBe(400);
  });
});
