/**
 * @file __tests__/api/admin/contratos.test.ts
 *
 * Testes para GET /api/admin/contratos
 * Lista todos os vínculos (com ou sem laudos/representantes) para perfil admin.
 * Diferença dos outros perfis: inclui valor_qwork e valor_custo_fixo_snapshot.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Admin Dev',
    perfil: 'admin',
  }),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { GET } from '@/app/api/admin/contratos/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

/** Vínculo com laudo, representante PF (cpf preenchido) */
const vinculoComLaudo = {
  contratante_nome: 'Clínica Admin Teste',
  contratante_cnpj: '11222333000100',
  contratante_id: 10,
  vinculo_id: 1,
  tipo_contratante: 'clinica',
  rep_nome: 'Carlos Rep',
  rep_cpf: '11122233344',
  rep_codigo: 'REP001',
  lead_data: '2026-01-05T00:00:00.000Z',
  contrato_data: '2026-01-20',
  tempo_dias: '15',
  tipo_comissionamento: 'percentual',
  percentual_comissao: '12.00',
  valor_custo_fixo: null,
  valor_negociado: '2000.00',
  total_laudos: '2',
  total_lotes: '2',
  avaliacoes_concluidas: '5',
  valor_avaliacao: '10.00',
  valor_total: '100.00',
  perc_comercial: '8.00',
  valor_comercial: '8.00',
  perc_rep: '12.00',
  valor_rep: '12.00',
  valor_qwork: '80.00',
  isento_pagamento: false,
};

/** Vínculo com representante PJ (cpf_responsavel_pj retornado via COALESCE como rep_cpf) */
const vinculoPJ = {
  contratante_nome: 'Entidade PJ Teste',
  contratante_cnpj: '55666777000188',
  contratante_id: 15,
  vinculo_id: 3,
  tipo_contratante: 'entidade',
  rep_nome: 'Empresa Rep LTDA',
  rep_cpf: '99988877766', // cpf_responsavel_pj via COALESCE
  rep_codigo: 'PJ001',
  lead_data: '2026-02-01T00:00:00.000Z',
  contrato_data: '2026-02-15',
  tempo_dias: '14',
  tipo_comissionamento: 'custo_fixo',
  percentual_comissao: null,
  valor_custo_fixo: '100.00',
  valor_negociado: null,
  total_laudos: '0',
  total_lotes: '0',
  avaliacoes_concluidas: '0',
  valor_avaliacao: null,
  valor_total: null,
  perc_comercial: null,
  valor_comercial: null,
  perc_rep: null,
  valor_rep: null,
  valor_qwork: null,
  isento_pagamento: false,
};

/** Vínculo sem laudo e sem representante */
const vinculoSemRep = {
  contratante_nome: 'Clínica Sem Rep',
  contratante_cnpj: '33444555000122',
  contratante_id: 30,
  vinculo_id: 5,
  tipo_contratante: 'clinica',
  rep_nome: null,
  rep_cpf: null,
  rep_codigo: null,
  lead_data: null,
  contrato_data: null,
  tempo_dias: null,
  tipo_comissionamento: null,
  percentual_comissao: null,
  valor_custo_fixo: null,
  valor_negociado: null,
  total_laudos: '0',
  total_lotes: '0',
  avaliacoes_concluidas: '0',
  valor_avaliacao: null,
  valor_total: null,
  perc_comercial: null,
  valor_comercial: null,
  perc_rep: null,
  valor_rep: null,
  valor_qwork: null,
  isento_pagamento: false,
};

describe('GET /api/admin/contratos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 401 quando não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Não autenticado');
  });

  it('retorna 401 quando sem permissão', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Sem permissão');
  });

  it('retorna 500 em erro interno inesperado', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro interno');
  });

  it('retorna array vazio quando não há vínculos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos).toEqual([]);
  });

  it('retorna contrato com laudos, rep PF e valor_qwork', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoComLaudo] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos).toHaveLength(1);
    const c = body.contratos[0];
    expect(c.contratante_nome).toBe('Clínica Admin Teste');
    expect(c.rep_nome).toBe('Carlos Rep');
    expect(c.rep_cpf).toBe('11122233344');
    expect(c.rep_codigo).toBe('REP001');
    expect(c.total_laudos).toBe('2');
    expect(c.valor_qwork).toBe('80.00');
  });

  it('retorna rep PJ com CPF via COALESCE(cpf, cpf_responsavel_pj)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoPJ] } as never);
    const res = await GET();
    const body = await res.json();
    const c = body.contratos[0];
    expect(c.rep_cpf).toBe('99988877766');
    expect(c.rep_nome).toBe('Empresa Rep LTDA');
  });

  it('retorna vínculos sem representante com rep_cpf null', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoSemRep] } as never);
    const res = await GET();
    const body = await res.json();
    const c = body.contratos[0];
    expect(c.rep_nome).toBeNull();
    expect(c.rep_cpf).toBeNull();
    expect(c.total_laudos).toBe('0');
  });

  it('retorna múltiplos vínculos incluindo sem rep e sem laudo', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [vinculoComLaudo, vinculoPJ, vinculoSemRep],
    } as never);
    const res = await GET();
    const body = await res.json();
    expect(body.contratos).toHaveLength(3);
  });

  it('a query usa vinculos_comissao como tabela principal com LEFT JOINs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('from public.vinculos_comissao');
    expect(sql).toContain('left join public.comissoes_laudo');
    expect(sql).toContain('left join public.representantes');
    // COALESCE para CPF PF e PJ
    expect(sql).toContain('cpf_responsavel_pj');
    // Agrega por vínculo
    expect(sql).toContain('count(distinct cl.laudo_id)');
  });

  it('inclui valor_qwork na query (diferença do comercial/suporte)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('valor_qwork');
  });

  it('inclui valor_custo_fixo_snapshot na query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('valor_custo_fixo_snapshot');
  });

  it('usa requireRole com perfil admin', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockRequireRole).toHaveBeenCalledWith('admin', false);
  });

  it('inclui campo isento_pagamento na resposta', async () => {
    const contratoIsento = { ...vinculoComLaudo, isento_pagamento: true };
    mockQuery.mockResolvedValueOnce({ rows: [contratoIsento] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos[0].isento_pagamento).toBe(true);
  });

  it('retorna isento_pagamento: false por padrão', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoComLaudo] } as never);
    const res = await GET();
    const body = await res.json();
    expect(body.contratos[0].isento_pagamento).toBe(false);
  });

  it('preserva o campo isento_pagamento também nas linhas do union sem vínculo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain(
      'coalesce(clin.isento_pagamento, ent.isento_pagamento, false)::boolean as isento_pagamento'
    );
    expect(sql).toContain('coalesce(ent2.isento_pagamento, false)::boolean');
    expect(sql.indexOf('as valor_qwork')).toBeLessThan(
      sql.indexOf('as isento_pagamento')
    );
  });
});
