import { GET } from '@/app/api/entidade/contrato-fallback/route';

jest.mock('@/lib/session', () => ({
  getSession: jest.fn().mockReturnValue({ perfil: 'gestor', entidade_id: 99 }),
}));

jest.mock('@/lib/db', () => ({ query: jest.fn() }));

import { query } from '@/lib/db';

describe('API contrato-fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna contrato baseado em contratos_planos quando existe', async () => {
    // Mock 1: planColsRes
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ column_name: 'preco' }],
    });
    // Mock 2: contratoPlanoQuery
    const criadoEm = new Date().toISOString();
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          plano_id: 9,
          plano_nome: 'Especial',
          plano_tipo: 'personalizado',
          plano_preco: '50.00',
          plano_valor_por_funcionario: null,
          plano_valor_base: null,
          plano_valor_fixo_anual: null,
          valor_total: '450.00',
          numero_funcionarios: 9,
          criado_em: criadoEm,
        },
      ],
      rowCount: 1,
    });
    // Mock 3: pagamentoRes (no pagos)
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const resp = await GET();
    const data = await resp.json();

    expect(data).toBeDefined();
    expect(data.plano_nome).toBe('Especial');
    expect(data.valor_total).toBe(450);
    expect(data.numero_funcionarios).toBe(9);
    // plano_preco_unitario agora retorna o valor de plano_preco quando disponível
    expect(data.plano_preco_unitario).toBe(50);
    expect(data.status).toBe('ativo');
    expect(data.vigencia_inicio).toBe(criadoEm);
    expect(data.vigencia_fim).toBeDefined();
  });

  it('retorna null quando não houver contratos_planos', async () => {
    // Mock planColsRes
    (query as jest.Mock).mockResolvedValueOnce({
      rows: [{ column_name: 'preco' }],
    });
    // Mock contratoPlanoQuery returns empty
    (query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const resp = await GET();
    const data = await resp.json();

    expect(data).toBeNull();
  });
});
