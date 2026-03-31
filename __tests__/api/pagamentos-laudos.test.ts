/**
 * @file __tests__/api/pagamentos-laudos.test.ts
 * @description Testes para as rotas de pagamentos de laudos (RH e Entidade)
 * @date 2026-02-18
 *
 * Cobre:
 * - GET /api/rh/pagamentos-laudos
 * - GET /api/entidade/pagamentos-laudos
 * - Mapeamento de campos (camelCase)
 * - Tratamento de erros (auth, db)
 * - Normalização de detalhes_parcelas
 * - Fallback quando clinica_id não está na sessão (busca por CPF)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockQueryRh = jest.fn();
const mockRequireRole = jest.fn();

jest.mock('@/lib/session', () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
  requireEntity: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQueryRh(...args),
}));

const mockQueryGestor = jest.fn();
jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: (...args: unknown[]) => mockQueryGestor(...args),
}));

// Importar após os mocks
import { GET as getRh } from '@/app/api/rh/pagamentos-laudos/route';
import { GET as getEntidade } from '@/app/api/entidade/pagamentos-laudos/route';
import { requireEntity } from '@/lib/session';

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fakePagamentoRow = (overrides = {}) => ({
  id: 1,
  valor: '1500.00',
  metodo: 'pix',
  status: 'pago',
  numero_parcelas: 1,
  detalhes_parcelas: null,
  numero_funcionarios: 10,
  valor_por_funcionario: '150.00',
  recibo_numero: 'REC-001',
  recibo_url: 'https://example.com/recibo/1',
  data_pagamento: '2026-02-01T00:00:00Z',
  data_confirmacao: '2026-02-01T00:00:00Z',
  criado_em: '2026-01-20T00:00:00Z',
  contrato_id: 5,
  lote_id: 42,
  lote_codigo: '42',
  lote_numero: 3,
  laudo_id: 99,
  ...overrides,
});

const successRows = (overrides = {}) => ({
  rows: [fakePagamentoRow(overrides)],
});

// ─── Testes: RH Route ─────────────────────────────────────────────────────────

describe('GET /api/rh/pagamentos-laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 403 quando sessão sem clinica_id e sem vínculo por CPF', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: null,
      entidade_id: null,
    });
    // Route rh apenas busca clínica via CPF — sem fallback para entidade
    mockQueryRh.mockResolvedValueOnce({ rows: [] }); // funcionarios_clinicas vazio

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('não está vinculado a uma clínica');
  });

  it('retorna pagamentos quando sessão tem clinica_id direto', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce(successRows());

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagamentos).toHaveLength(1);
    const p = body.pagamentos[0];
    expect(p.id).toBe(1);
    expect(p.valor).toBe(1500);
    expect(p.metodo).toBe('pix');
    expect(p.status).toBe('pago');
    expect(p.numeroParcelas).toBe(1);
    expect(p.numeroFuncionarios).toBe(10);
    expect(p.valorPorFuncionario).toBe(150);
    expect(p.reciboNumero).toBe('REC-001');
    expect(p.loteId).toBe(42);
    expect(p.loteCodigo).toBe('42');
    expect(p.loteNumero).toBe(3);
    expect(p.laudoId).toBe(99);
  });

  it('busca clinica_id por CPF quando não está na sessão', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '98765432100',
      clinica_id: null,
      entidade_id: null,
    });
    // Primeira query retorna clinica_id
    mockQueryRh
      .mockResolvedValueOnce({ rows: [{ clinica_id: 15 }] })
      .mockResolvedValueOnce(successRows());

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagamentos).toHaveLength(1);
  });

  it('retorna 403 quando CPF não encontra clínica (sem fallback para entidade)', async () => {
    // Route rh removeu o fallback para entidade — apenas clínica é suportada
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      clinica_id: null,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce({ rows: [] }); // clinica não encontrada via CPF

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('não está vinculado a uma clínica');
  });

  it('retorna 403 quando sessão tem apenas entidade_id sem clínica', async () => {
    // entidade_id na sessão não é suficiente para a rota rh (que é exclusiva de clínicas)
    mockRequireRole.mockResolvedValueOnce({
      cpf: '00011122233',
      clinica_id: null,
      entidade_id: 20,
    });
    mockQueryRh.mockResolvedValueOnce({ rows: [] }); // clinica não encontrada via CPF

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('não está vinculado a uma clínica');
  });

  it('usa la.clinica_id (não la.contratante_id) na query SQL de lotes', async () => {
    // Valida fix: SQL deve usar la.clinica_id após refactoring contratante→tomador
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce({ rows: [] });

    await getRh();

    const [sqlQuery] = mockQueryRh.mock.calls[0];
    expect(String(sqlQuery)).toContain('la.clinica_id = p.clinica_id');
    expect(String(sqlQuery)).not.toContain('la.contratante_id');
  });

  it('mapeia valor_por_funcionario null para null no retorno', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce(
      successRows({ valor_por_funcionario: null })
    );

    const response = await getRh();
    const body = await response.json();

    expect(body.pagamentos[0].valorPorFuncionario).toBeNull();
  });

  it('retorna 500 quando query lança erro', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Erro interno do servidor');
  });

  it('retorna lista vazia quando não há pagamentos', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 3,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce({ rows: [] });

    const response = await getRh();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagamentos).toEqual([]);
  });

  it('mapeia pagamento parcelado com detalhes_parcelas', async () => {
    const parcelas = [
      { numero: 1, valor: 500, vencimento: '2026-03-01' },
      { numero: 2, valor: 500, vencimento: '2026-04-01' },
      { numero: 3, valor: 500, vencimento: '2026-05-01' },
    ];
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce(
      successRows({
        metodo: 'cartao',
        numero_parcelas: 3,
        valor: '1500.00',
        detalhes_parcelas: parcelas,
      })
    );

    const response = await getRh();
    const body = await response.json();

    const p = body.pagamentos[0];
    expect(p.numeroParcelas).toBe(3);
    expect(p.metodo).toBe('cartao');
    // normalizarDetalhesParcelas enriquece parcelas com campos de status ─ verificar estrutura core
    expect(p.detalhesParcelas).toHaveLength(3);
    expect(p.detalhesParcelas[0]).toMatchObject({ numero: 1, valor: 500 });
    expect(p.detalhesParcelas[1]).toMatchObject({ numero: 2, valor: 500 });
    expect(p.detalhesParcelas[2]).toMatchObject({ numero: 3, valor: 500 });
  });
});

// ─── Testes: Entidade Route ───────────────────────────────────────────────────

describe('GET /api/entidade/pagamentos-laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna pagamentos para gestor de entidade autenticado', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 100,
      cpf: '29930511059',
    } as never);
    mockQueryGestor.mockResolvedValueOnce(successRows());

    const response = await getEntidade();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagamentos).toHaveLength(1);
    const p = body.pagamentos[0];
    expect(p.valor).toBe(1500);
    expect(p.metodo).toBe('pix');
    expect(p.lote_id).toBeUndefined(); // campo snake_case não deve aparecer
    expect(p.loteId).toBe(42);
    expect(p.loteCodigo).toBe('42');
    expect(p.loteNumero).toBe(3);
    expect(p.laudoId).toBe(99);
  });

  it('passa entidade_id correto como parâmetro para a query', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 77,
      cpf: '11100011100',
    } as never);
    mockQueryGestor.mockResolvedValueOnce({ rows: [] });

    await getEntidade();

    // Verifica que foi chamado com entidade_id = 77
    expect(mockQueryGestor).toHaveBeenCalledTimes(1);
    const [, params] = mockQueryGestor.mock.calls[0];
    expect(params).toEqual([77]);
  });

  it('retorna 500 quando queryAsGestorEntidade lança erro', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 100,
      cpf: '29930511059',
    } as never);
    mockQueryGestor.mockRejectedValueOnce(
      new Error('column la.codigo does not exist')
    );

    const response = await getEntidade();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Erro interno do servidor');
  });

  it('retorna 500 quando requireEntity lança erro de autenticação', async () => {
    mockRequireEntity.mockRejectedValueOnce(new Error('Não autorizado'));

    const response = await getEntidade();
    const body = await response.json();

    expect(response.status).toBe(500);
  });

  it('normaliza campos opcionais para null quando ausentes', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 100,
      cpf: '29930511059',
    } as never);
    mockQueryGestor.mockResolvedValueOnce(
      successRows({
        recibo_numero: null,
        recibo_url: null,
        data_pagamento: null,
        data_confirmacao: null,
        contrato_id: null,
        lote_id: null,
        lote_codigo: null,
        lote_numero: null,
        laudo_id: null,
        numero_funcionarios: null,
        valor_por_funcionario: null,
      })
    );

    const response = await getEntidade();
    const body = await response.json();
    const p = body.pagamentos[0];

    expect(p.reciboNumero).toBeNull();
    expect(p.reciboUrl).toBeNull();
    expect(p.dataPagamento).toBeNull();
    expect(p.dataConfirmacao).toBeNull();
    expect(p.contratoId).toBeNull();
    expect(p.loteId).toBeNull();
    expect(p.loteCodigo).toBeNull();
    expect(p.loteNumero).toBeNull();
    expect(p.laudoId).toBeNull();
    expect(p.numeroFuncionarios).toBeNull();
    expect(p.valorPorFuncionario).toBeNull();
  });

  it('retorna lista vazia quando entidade não tem pagamentos', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 200,
      cpf: '55566677788',
    } as never);
    mockQueryGestor.mockResolvedValueOnce({ rows: [] });

    const response = await getEntidade();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pagamentos).toEqual([]);
  });
});

// ─── Testes: Lógica de Normalização ──────────────────────────────────────────

describe('Normalização de campos de pagamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('converte valor string do banco para número float', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce(
      successRows({ valor: '2750.50', valor_por_funcionario: '275.05' })
    );

    const response = await getRh();
    const body = await response.json();
    const p = body.pagamentos[0];

    expect(typeof p.valor).toBe('number');
    expect(p.valor).toBeCloseTo(2750.5, 2);
    expect(typeof p.valorPorFuncionario).toBe('number');
    expect(p.valorPorFuncionario).toBeCloseTo(275.05, 2);
  });

  it('default numeroParcelas para 1 quando banco retorna null', async () => {
    mockRequireRole.mockResolvedValueOnce({
      cpf: '12345678900',
      clinica_id: 7,
      entidade_id: null,
    });
    mockQueryRh.mockResolvedValueOnce(successRows({ numero_parcelas: null }));

    const response = await getRh();
    const body = await response.json();

    expect(body.pagamentos[0].numeroParcelas).toBe(1);
  });

  it('default detalhesParcelas para null quando banco retorna null', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 100,
      cpf: '29930511059',
    } as never);
    mockQueryGestor.mockResolvedValueOnce(
      successRows({ detalhes_parcelas: null })
    );

    const response = await getEntidade();
    const body = await response.json();

    expect(body.pagamentos[0].detalhesParcelas).toBeNull();
  });

  it('normaliza detalhes_parcelas array quando presente', async () => {
    // detalhes_parcelas vem do Postgres como array JSONB ─ normalizarDetalhesParcelas processa
    const parcelasArray = [{ numero: 1, valor: 500, vencimento: '2026-03-01' }];
    mockRequireEntity.mockResolvedValueOnce({
      entidade_id: 100,
      cpf: '29930511059',
    } as never);
    mockQueryGestor.mockResolvedValueOnce(
      successRows({ detalhes_parcelas: parcelasArray })
    );

    const response = await getEntidade();
    const body = await response.json();

    expect(Array.isArray(body.pagamentos[0].detalhesParcelas)).toBe(true);
    expect(body.pagamentos[0].detalhesParcelas).toHaveLength(1);
    expect(body.pagamentos[0].detalhesParcelas[0]).toMatchObject({
      numero: 1,
      valor: 500,
    });
  });
});
