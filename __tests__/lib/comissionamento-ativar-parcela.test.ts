/**
 * @fileoverview Testes unitários de ativarComissaoParcelaPaga e criarComissaoAutomatica
 *
 * Cobre (migration 532 — 15/03/2026):
 *
 * ativarComissaoParcelaPaga:
 *   - Comissão não encontrada → { ok: false, motivo: 'comissao_nao_encontrada' }
 *   - Idempotente: parcela_confirmada_em NOT NULL → { ok: true, motivo: 'ja_ativada' }
 *   - Rep apto: seta parcela_confirmada_em + transiciona status para 'paga' (split já executado)
 *   - Rep não apto: seta apenas parcela_confirmada_em, mantém status retida
 *   - Erro interno (query lança) → { ok: false, motivo: 'erro_interno' }
 *
 * criarComissaoAutomatica:
 *   - Sem entidade nem clínica → { ok: false, motivo: 'sem_entidade_clinica' }
 *   - Sem vínculo ativo → { ok: false, motivo: 'sem_vinculo' }
 *   - À vista (total_parcelas=1, existingCount=0): cria 1 comissão com parcela_confirmada_em=NOW()
 *   - Parcelado (total_parcelas>1, existingCount=0): provisiona N comissões + ativa parcela paga
 *   - Parcelado subsequente (existingCount>0): apenas chama ativarComissaoParcelaPaga
 *   - Duplicata à vista → { ok: false, motivo: 'duplicata' }
 */

jest.mock('@/lib/db/query', () => ({ query: jest.fn() }));

import {
  ativarComissaoParcelaPaga,
  criarComissaoAutomatica,
} from '@/lib/db/comissionamento';
import { query } from '@/lib/db/query';

const mockQuery = query as jest.MockedFunction<typeof query>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const VINCULO = {
  id: 4,
  representante_id: 6,
  entidade_id: 16,
  clinica_id: null,
};

/** Sequência mínima de queries para criarComissaoAdmin aprovada */
function mockCriarAdmin({
  repStatus = 'apto',
  percentual = '10.00',
}: { repStatus?: string; percentual?: string } = {}) {
  mockQuery
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // sem dup
    .mockResolvedValueOnce({
      rows: [{ id: VINCULO.id, status: 'ativo', data_expiracao: '2099-01-01' }],
      rowCount: 1,
    } as any) // vínculo
    .mockResolvedValueOnce({
      rows: [{ id: 6, status: repStatus, percentual_comissao: percentual }],
      rowCount: 1,
    } as any) // rep
    .mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao_representante: percentual,
          valor_negociado: null,
        },
      ],
      rowCount: 1,
    } as any) // vinculos percentual
    .mockResolvedValueOnce({
      rows: [
        {
          id: 99,
          status: 'retida',
          valor_comissao: '5.00',
        },
      ],
      rowCount: 1,
    } as any) // INSERT comissao
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // auditoria
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // UPDATE vínculo
}

// ── ativarComissaoParcelaPaga ─────────────────────────────────────────────────

describe('ativarComissaoParcelaPaga', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar { ok: false, motivo: "comissao_nao_encontrada" } quando não há registro', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await ativarComissaoParcelaPaga({
      lote_id: 1,
      parcela_numero: 1,
    });

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('comissao_nao_encontrada');
    // Apenas 1 SELECT executado
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve retornar { ok: true, motivo: "ja_ativada" } quando parcela_confirmada_em não é null (idempotente)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          status: 'paga',
          parcela_confirmada_em: new Date(),
          rep_status: 'apto',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await ativarComissaoParcelaPaga({
      lote_id: 1,
      parcela_numero: 1,
    });

    expect(res.ok).toBe(true);
    expect(res.motivo).toBe('ja_ativada');
    // Sem UPDATE executado
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('deve fazer UPDATE + auditoria e retornar { ok: true } quando rep é apto', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            status: 'retida',
            parcela_confirmada_em: null,
            rep_status: 'apto',
          },
        ],
        rowCount: 1,
      } as any) // SELECT
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // auditoria

    const res = await ativarComissaoParcelaPaga({
      lote_id: 5,
      parcela_numero: 2,
    });

    expect(res.ok).toBe(true);
    expect(res.motivo).toBeUndefined();

    // UPDATE deve ser chamado com apenas o id da comissão ($1)
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1]).toEqual([10]);
  });

  it('deve fazer UPDATE com repApto=false e retornar { ok: true } quando rep não é apto', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            status: 'retida',
            parcela_confirmada_em: null,
            rep_status: 'suspenso',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // auditoria

    const res = await ativarComissaoParcelaPaga({
      lote_id: 5,
      parcela_numero: 2,
    });

    expect(res.ok).toBe(true);

    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1]).toEqual([10]);
  });

  it('deve retornar { ok: false, motivo: "erro_interno" } quando query lança exceção', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB offline'));

    const res = await ativarComissaoParcelaPaga({
      lote_id: 1,
      parcela_numero: 1,
    });

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('erro_interno');
  });
});

// ── criarComissaoAutomatica ───────────────────────────────────────────────────

describe('criarComissaoAutomatica', () => {
  beforeEach(() => jest.clearAllMocks());

  const BASE = {
    lote_id: 10,
    entidade_id: 16,
    clinica_id: null,
    valor_total_lote: 300,
    valor_parcela_liquida: 100,
    parcela_numero: 1,
    total_parcelas: 1,
  };

  // ── Guards ──────────────────────────────────────────────────────────────
  it('deve retornar { ok: false, motivo: "sem_entidade_clinica" } sem entidade nem clínica', async () => {
    const res = await criarComissaoAutomatica({
      ...BASE,
      entidade_id: null,
      clinica_id: null,
    });

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('sem_entidade_clinica');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve retornar { ok: false, motivo: "sem_vinculo" } quando nenhum vínculo ativo encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // SELECT vínculos

    const res = await criarComissaoAutomatica(BASE);

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('sem_vinculo');
  });

  // ── À vista (total_parcelas=1) ────────────────────────────────────────
  it('deve criar 1 comissão com parcela_confirmada_em=Date no fluxo à vista', async () => {
    // 1. SELECT vínculos
    mockQuery.mockResolvedValueOnce({ rows: [VINCULO], rowCount: 1 } as any);
    // 2. COUNT existing → 0
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '0' }],
      rowCount: 1,
    } as any);
    // 3..8 criarComissaoAdmin internamente
    mockCriarAdmin({ repStatus: 'apto' });

    const res = await criarComissaoAutomatica({ ...BASE, total_parcelas: 1 });

    expect(res.ok).toBe(true);
    expect(res.comissao).toBeDefined();
  });

  it('deve retornar { ok: false, motivo: "duplicata" } quando à vista já existe', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [VINCULO], rowCount: 1 } as any) // vínculos
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any) // COUNT 0
      // criarComissaoAdmin: dup check retorna um registro → erro
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 } as any);

    const res = await criarComissaoAutomatica({ ...BASE, total_parcelas: 1 });

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('duplicata');
  });

  // ── Parcelado — 1ª chamada (provisioning) ───────────────────────────────
  it('deve provisionar N comissões e ativar a parcela paga no fluxo parcelado (1ª chamada)', async () => {
    const totalParcelas = 3;

    // 1. SELECT vínculos
    mockQuery.mockResolvedValueOnce({ rows: [VINCULO], rowCount: 1 } as any);
    // 2. COUNT existing → 0
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '0' }],
      rowCount: 1,
    } as any);

    // criarComissaoAdmin × 3 parcelas (cada uma = 6 queries: dup, vínculo, rep, INSERT, auditoria, UPDATE)
    for (let p = 0; p < totalParcelas; p++) {
      mockCriarAdmin({ repStatus: 'apto' });
    }

    // ativarComissaoParcelaPaga:
    // SELECT comissão → parcela_confirmada_em IS NULL (provisioned)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 99,
          status: 'retida',
          parcela_confirmada_em: null,
          rep_status: 'apto',
        },
      ],
      rowCount: 1,
    } as any);
    // UPDATE
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // auditoria
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await criarComissaoAutomatica({
      ...BASE,
      total_parcelas: totalParcelas,
      parcela_numero: 1,
    });

    expect(res.ok).toBe(true);
  });

  // ── Parcelado — chamadas subsequentes ────────────────────────────────────
  it('deve apenas chamar ativarComissaoParcelaPaga quando comissões já existem (parcela subsequente)', async () => {
    // 1. SELECT vínculos
    mockQuery.mockResolvedValueOnce({ rows: [VINCULO], rowCount: 1 } as any);
    // 2. COUNT existing → 3 (já provisionadas)
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '3' }],
      rowCount: 1,
    } as any);

    // ativarComissaoParcelaPaga para parcela 2:
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 100,
          status: 'retida',
          parcela_confirmada_em: null,
          rep_status: 'apto',
        },
      ],
      rowCount: 1,
    } as any); // SELECT
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // auditoria

    const res = await criarComissaoAutomatica({
      ...BASE,
      total_parcelas: 3,
      parcela_numero: 2,
    });

    expect(res.ok).toBe(true);

    // Garantia: não chamou criarComissaoAdmin (sem INSERT de comissão nova)
    // O COUNT é o 2º call; o 3º deve ser o SELECT do ativarComissaoParcelaPaga
    const terceiro = mockQuery.mock.calls[2][0];
    expect(terceiro).toMatch(/parcela_confirmada_em/i);
  });

  // ── Erro interno ─────────────────────────────────────────────────────────
  it('deve retornar { ok: false, motivo: "erro_interno" } quando query lança exceção', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB timeout'));

    const res = await criarComissaoAutomatica(BASE);

    expect(res.ok).toBe(false);
    expect(res.motivo).toBe('erro_interno');
  });
});
