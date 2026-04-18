/**
 * @file __tests__/api/suporte/contratos.test.ts
 *
 * Testes para GET /api/suporte/contratos
 * Lista todos os vínculos (com ou sem laudos/representantes) para perfil suporte.
 * Diferença do comercial: inclui valor_custo_fixo_snapshot e NÃO inclui valor_qwork.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Suporte Dev',
    perfil: 'suporte',
  }),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { GET } from '@/app/api/suporte/contratos/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

/** Vínculo com laudo, representante e custo_fixo_snapshot */
const vinculoComLaudo = {
  contratante_nome: 'Entidade Teste',
  contratante_cnpj: '11222333000100',
  contratante_id: 10,
  vinculo_id: 1,
  tipo_contratante: 'entidade',
  rep_nome: 'Maria Rep',
  rep_cpf: '98765432100',
  rep_codigo: 'XYZ789',
  lead_data: '2026-01-10T00:00:00.000Z',
  contrato_data: '2026-02-05',
  tempo_dias: '26',
  tipo_comissionamento: 'custo_fixo',
  percentual_comissao: null,
  valor_custo_fixo: '50.00',
  valor_negociado: '1000.00',
  total_laudos: '1',
  total_lotes: '1',
  avaliacoes_concluidas: '1',
  valor_avaliacao: '60.00',
  valor_total: '60.00',
  perc_comercial: '5.00',
  valor_comercial: '2.00',
  perc_rep: null,
  valor_rep: '58.00',
  isento_pagamento: false,
};

/** Vínculo sem laudo e sem representante — deve aparecer na listagem */
const vinculoSemLaudo = {
  contratante_nome: 'Clínica Sem Vinculo',
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
};

describe('GET /api/suporte/contratos', () => {
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

  it('retorna contratos com vínculos que possuem laudos e representante', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoComLaudo] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos).toHaveLength(1);
    const c = body.contratos[0];
    expect(c.contratante_nome).toBe('Entidade Teste');
    expect(c.tipo_contratante).toBe('entidade');
    expect(c.rep_nome).toBe('Maria Rep');
    expect(c.rep_cpf).toBe('98765432100');
    expect(c.total_laudos).toBe('1');
    expect(c.valor_custo_fixo).toBe('50.00');
  });

  it('retorna vínculos sem laudo e sem representante (não filtra fora)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [vinculoComLaudo, vinculoSemLaudo],
    } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos).toHaveLength(2);
    const semLaudo = body.contratos.find(
      (c: { vinculo_id: number }) => c.vinculo_id === 5
    );
    expect(semLaudo).toBeDefined();
    expect(semLaudo.rep_nome).toBeNull();
    expect(semLaudo.total_laudos).toBe('0');
  });

  it('a query usa vinculos_comissao como tabela principal (LEFT JOIN)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('from public.vinculos_comissao');
    expect(sql).toContain('left join public.comissoes_laudo');
    expect(sql).toContain('left join public.representantes');
    // COALESCE para CPF de PF e PJ
    expect(sql).toContain('cpf_responsavel_pj');
    // Agrega por vínculo
    expect(sql).toContain('count(distinct cl.laudo_id)');
  });

  it('não inclui campo valor_qwork na query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).not.toContain('valor_qwork');
  });

  it('inclui valor_custo_fixo_snapshot (diferença do comercial)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('valor_custo_fixo_snapshot');
  });

  it('usa requireRole com perfil suporte', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockRequireRole).toHaveBeenCalledWith('suporte', false);
  });

  it('inclui campo isento_pagamento na resposta', async () => {
    const contratoComIsento = { ...vinculoComLaudo, isento_pagamento: true };
    mockQuery.mockResolvedValueOnce({ rows: [contratoComIsento] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos[0].isento_pagamento).toBe(true);
  });

  it('retorna isento_pagamento: false quando nenhum parceiro isento', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [vinculoComLaudo] } as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contratos[0].isento_pagamento).toBe(false);
  });

  it('a query inclui COALESCE de clin.isento_pagamento e ent.isento_pagamento', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    expect(sql).toContain('coalesce(clin.isento_pagamento, ent.isento_pagamento, false)');
  });
});
