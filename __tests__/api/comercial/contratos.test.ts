/**
 * @file __tests__/api/comercial/contratos.test.ts
 *
 * Testes para GET /api/comercial/contratos
 * Lista todos os vínculos (com ou sem laudos/representantes) para perfil comercial.
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
import { requireRole } from '@/lib/session';
import { GET } from '@/app/api/comercial/contratos/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

/** Linha com laudo + representante vinculado */
const vinculoComLaudo = {
  contratante_nome: 'Clínica Teste',
  contratante_cnpj: '11222333000100',
  contratante_id: 10,
  vinculo_id: 1,
  tipo_contratante: 'clinica',
  rep_nome: 'João Rep',
  rep_cpf: '12345678900',
  rep_codigo: 'ABC123',
  lead_data: '2026-01-15T00:00:00.000Z',
  contrato_data: '2026-02-01',
  tempo_dias: '17',
  tipo_comissionamento: 'percentual',
  percentual_comissao: '10.00',
  valor_negociado: '500.00',
  total_laudos: '1',
  total_lotes: '1',
  avaliacoes_concluidas: '3',
  valor_avaliacao: '8.00',
  valor_total: '24.00',
  perc_comercial: '10.00',
  valor_comercial: '0.80',
  perc_rep: '10.00',
  valor_rep: '0.60',
};

/** Vínculo sem laudo e sem representante — deve aparecer na listagem */
const vinculoSemLaudo = {
  contratante_nome: 'Entidade Sem Laudo',
  contratante_cnpj: '22333444000111',
  contratante_id: 20,
  vinculo_id: 2,
  tipo_contratante: 'entidade',
  rep_nome: null,
  rep_cpf: null,
  rep_codigo: null,
  lead_data: null,
  contrato_data: '2026-03-10',
  tempo_dias: null,
  tipo_comissionamento: null,
  percentual_comissao: null,
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

describe('GET /api/comercial/contratos', () => {
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
    expect(c.contratante_nome).toBe('Clínica Teste');
    expect(c.tipo_contratante).toBe('clinica');
    expect(c.rep_nome).toBe('João Rep');
    expect(c.rep_cpf).toBe('12345678900');
    expect(c.total_laudos).toBe('1');
    expect(c.valor_total).toBe('24.00');
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
      (c: { vinculo_id: number }) => c.vinculo_id === 2
    );
    expect(semLaudo).toBeDefined();
    expect(semLaudo.rep_nome).toBeNull();
    expect(semLaudo.total_laudos).toBe('0');
    expect(semLaudo.valor_total).toBeNull();
  });

  it('a query usa vinculos_comissao como tabela principal (LEFT JOIN)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = (mockQuery.mock.calls[0][0] as string).toLowerCase();
    // Parte de vinculos_comissao, não de comissoes_laudo
    expect(sql).toContain('from public.vinculos_comissao');
    expect(sql).toContain('left join public.comissoes_laudo');
    // Não deve filtrar por representante (LEFT JOIN)
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

  it('usa requireRole com perfil comercial', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    await GET();
    expect(mockRequireRole).toHaveBeenCalledWith('comercial', false);
  });
});
