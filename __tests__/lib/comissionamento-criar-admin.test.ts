/**
 * @fileoverview Testes unitários de criarComissaoAdmin (lib/db/comissionamento.ts)
 *
 * Cobre:
 * - Correção 06/03/2026: SQL usa `::status_comissao` nas duas ocorrências de $10
 *   para evitar o erro PostgreSQL 42P08 "tipos inconsistentes deduzidos do parâmetro $10"
 * - Lógica de status inicial: 'pendente_consolidacao' para rep.status='apto', 'retida' para demais
 * - Guards de negócio: duplicata, percentual nulo, vínculo inválido, sem entidade/clínica
 * - Adições 15/03/2026 (migration 532):
 *   - forcar_retida=true → status sempre 'retida' mesmo com rep apto
 *   - parcela_confirmada_em=$15: NULL para futuras, Date para pagas
 */

jest.mock('@/lib/db/query', () => ({
  query: jest.fn(),
}));

import { criarComissaoAdmin } from '@/lib/db/comissionamento';
import { query } from '@/lib/db/query';

const mockQuery = query as jest.MockedFunction<typeof query>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFluxoCompleto({
  repStatus = 'apto',
  percentual = '10.00',
  vinculoStatus = 'ativo',
}: {
  repStatus?: string;
  percentual?: string | null;
  vinculoStatus?: string;
} = {}) {
  mockQuery
    // 1. Checagem de duplicata → vazio (sem dup)
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
    // 2. Verificação de vínculo
    .mockResolvedValueOnce({
      rows: [{ id: 4, status: vinculoStatus, data_expiracao: null }],
      rowCount: 1,
    } as any)
    // 3. Verificação de representante
    .mockResolvedValueOnce({
      rows: [{ id: 6, status: repStatus, percentual_comissao: percentual }],
      rowCount: 1,
    } as any)
    // 4. Busca percentual/valor_negociado do vínculo
    .mockResolvedValueOnce({
      rows: [{ percentual_comissao_representante: percentual, valor_negociado: null }],
      rowCount: 1,
    } as any)
    // 5. INSERT comissão
    .mockResolvedValueOnce({
      rows: [
        {
          id: 99,
          status: repStatus === 'apto' ? 'pendente_consolidacao' : 'retida',
          valor_comissao: '3.30',
          percentual_comissao: percentual,
        },
      ],
      rowCount: 1,
    } as any)
    // 5. INSERT auditoria
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
    // 6. UPDATE vinculos_comissao
    .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
}

const BASE_PARAMS = {
  lote_pagamento_id: 27,
  vinculo_id: 4,
  representante_id: 6,
  entidade_id: 16,
  valor_laudo: 33,
};

// ── Testes ────────────────────────────────────────────────────────────────────

describe('criarComissaoAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Bug fix 06/03/2026: cast explícito ::status_comissao ─────────────────
  describe('correção 42P08 — cast ::status_comissao no INSERT', () => {
    it('deve usar ::status_comissao nas duas ocorrências de $10 no SQL do INSERT', async () => {
      mockFluxoCompleto();

      await criarComissaoAdmin(BASE_PARAMS);

      // O 4º call é o INSERT de comissões
      const insertCallArgs = mockQuery.mock.calls[4];
      const sql: string = insertCallArgs[0];

      // Verifica que $10 é castado para o enum em ambos os usos
      expect(sql).toMatch(/\$10::status_comissao/);
      // Garante que o CASE WHEN também usa o cast (e não texto puro)
      expect(sql).not.toMatch(/CASE WHEN \$10 = /);
      expect(sql).toMatch(/CASE WHEN \$10::status_comissao = /);
    });

    it('o valor passado para $10 deve ser string do enum, não objeto', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin(BASE_PARAMS);

      const insertCallValues = mockQuery.mock.calls[4][1];
      // $10 é o 10º parâmetro (índice 9), valor 'pendente_consolidacao'
      expect(insertCallValues[9]).toBe('pendente_consolidacao');
      expect(typeof insertCallValues[9]).toBe('string');
    });
  });

  // ── Status inicial ────────────────────────────────────────────────────────
  describe('status inicial', () => {
    it('deve usar status "pendente_consolidacao" quando representante.status = "apto"', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin(BASE_PARAMS);

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[9]).toBe('pendente_consolidacao');
    });

    it('deve usar status "retida" quando representante.status = "suspenso"', async () => {
      mockFluxoCompleto({ repStatus: 'suspenso' });

      await criarComissaoAdmin(BASE_PARAMS);

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[9]).toBe('retida');
    });

    it('deve usar status "retida" quando representante.status = "inativo"', async () => {
      mockFluxoCompleto({ repStatus: 'inativo' });

      await criarComissaoAdmin(BASE_PARAMS);

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[9]).toBe('retida');
    });

    // ── forcar_retida (migration 532) ──────────────────────────────────────
    it('deve usar status "retida" quando forcar_retida=true mesmo com rep apto', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({ ...BASE_PARAMS, forcar_retida: true });

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[9]).toBe('retida');
    });

    it('deve usar status "pendente_consolidacao" quando forcar_retida=false e rep apto', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({ ...BASE_PARAMS, forcar_retida: false });

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[9]).toBe('pendente_consolidacao');
    });
  });

  // ── parcela_confirmada_em (migration 532) ─────────────────────────────────
  describe('parcela_confirmada_em', () => {
    it('deve passar null como $15 quando parcela_confirmada_em não informado (padrão)', async () => {
      mockFluxoCompleto();

      await criarComissaoAdmin(BASE_PARAMS);

      const insertCallValues = mockQuery.mock.calls[4][1];
      // $15 é o 15º parâmetro (índice 14)
      expect(insertCallValues[14]).toBeNull();
    });

    it('deve passar null como $15 quando parcela_confirmada_em=null (parcela futura)', async () => {
      mockFluxoCompleto();

      await criarComissaoAdmin({ ...BASE_PARAMS, parcela_confirmada_em: null });

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[14]).toBeNull();
    });

    it('deve passar ISO string como $15 quando parcela_confirmada_em=Date (parcela paga)', async () => {
      mockFluxoCompleto();

      const agora = new Date('2026-03-15T10:00:00.000Z');
      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_confirmada_em: agora,
      });

      const insertCallValues = mockQuery.mock.calls[4][1];
      expect(insertCallValues[14]).toBe(agora.toISOString());
    });

    it('deve incluir parcela_confirmada_em no INSERT SQL (coluna $15)', async () => {
      mockFluxoCompleto();

      await criarComissaoAdmin(BASE_PARAMS);

      const insertSql: string = mockQuery.mock.calls[4][0];
      expect(insertSql).toContain('parcela_confirmada_em');
      expect(insertSql).toMatch(/\$15/);
    });
  });

  // ── Guards de negócio ─────────────────────────────────────────────────────
  describe('guards de negócio', () => {
    it('deve retornar erro quando não há entidade_id nem clinica_id', async () => {
      const { lote_pagamento_id, vinculo_id, representante_id, valor_laudo } =
        BASE_PARAMS;
      const result = await criarComissaoAdmin({
        lote_pagamento_id,
        vinculo_id,
        representante_id,
        valor_laudo,
      });

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/entidade_id ou clinica_id/i);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando comissão já foi gerada para o lote (duplicata)', async () => {
      // Duplicata → retorna 1 registro
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 55 }],
        rowCount: 1,
      } as any);

      const result = await criarComissaoAdmin(BASE_PARAMS);

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/já gerada/i);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro quando vínculo não é encontrado', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // sem dup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // vínculo não encontrado

      const result = await criarComissaoAdmin(BASE_PARAMS);

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/vínculo/i);
    });

    it('deve retornar erro quando status do vínculo é inválido', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 4, status: 'cancelado', data_expiracao: null }],
          rowCount: 1,
        } as any);

      const result = await criarComissaoAdmin(BASE_PARAMS);

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/cancelado/);
    });

    it('deve retornar erro quando percentual de comissão é null', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 4, status: 'ativo', data_expiracao: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 6, status: 'apto', percentual_comissao: null, modelo_comissionamento: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ percentual_comissao_representante: null, valor_negociado: null }],
          rowCount: 1,
        } as any);

      const result = await criarComissaoAdmin(BASE_PARAMS);

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/percentual/i);
      // Não deve ter chegado ao INSERT
      expect(mockQuery).toHaveBeenCalledTimes(4);
    });

    it('deve retornar erro quando representante não existe', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({
          rows: [{ id: 4, status: 'ativo', data_expiracao: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep não encontrado

      const result = await criarComissaoAdmin(BASE_PARAMS);

      expect(result.comissao).toBeNull();
      expect(result.erro).toMatch(/representante/i);
    });
  });

  // ── Cálculo de comissão ───────────────────────────────────────────────────
  describe('cálculo do valor da comissão', () => {
    it('deve calcular valor_comissao corretamente (valor_laudo × percentual / 100)', async () => {
      mockFluxoCompleto({ repStatus: 'apto', percentual: '10.00' });

      await criarComissaoAdmin({ ...BASE_PARAMS, valor_laudo: 33 });

      const insertValues = mockQuery.mock.calls[4][1];
      // $9 = valor_comissao (índice 8) = 33 × 10 / 100 = 3.30
      expect(insertValues[8]).toBeCloseTo(3.3, 2);
    });

    it('deve usar clinica_id quando entidade_id não fornecida', async () => {
      mockFluxoCompleto();

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        entidade_id: undefined,
        clinica_id: 7,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      // $3 = entidade_id (índice 2) → null
      expect(insertValues[2]).toBeNull();
      // $4 = clinica_id (índice 3)
      expect(insertValues[3]).toBe(7);
    });
  });

  // ── mes_pagamento por número de parcela (correção 15/03/2026) ────────────
  describe('mes_pagamento por número de parcela', () => {
    beforeEach(() => {
      // Fixa o tempo em 15/03/2026 → mes_pagamento base = abril/2026
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('parcela 1/4 → mes_pagamento = abril/2026 (base)', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 1,
        total_parcelas: 4,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      // $12 = mes_pagamento (índice 11)
      expect(insertValues[11]).toBe('2026-04-01');
    });

    it('parcela 2/4 → mes_pagamento = maio/2026 (base + 1 mês)', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 2,
        total_parcelas: 4,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      expect(insertValues[11]).toBe('2026-05-01');
    });

    it('parcela 3/4 → mes_pagamento = junho/2026 (base + 2 meses)', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 3,
        total_parcelas: 4,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      expect(insertValues[11]).toBe('2026-06-01');
    });

    it('parcela 4/4 → mes_pagamento = julho/2026 (base + 3 meses)', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 4,
        total_parcelas: 4,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      expect(insertValues[11]).toBe('2026-07-01');
    });

    it('à vista (parcela 1/1) → mes_pagamento = próximo mês sem deslocamento', async () => {
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 1,
        total_parcelas: 1,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      expect(insertValues[11]).toBe('2026-04-01');
    });

    it('parcela 3/3 em dezembro → atravessa virada de ano corretamente', async () => {
      jest.setSystemTime(new Date('2026-12-01T12:00:00.000Z'));
      mockFluxoCompleto({ repStatus: 'apto' });

      await criarComissaoAdmin({
        ...BASE_PARAMS,
        parcela_numero: 3,
        total_parcelas: 3,
      });

      const insertValues = mockQuery.mock.calls[4][1];
      // base = jan/2027, + 2 meses = mar/2027
      expect(insertValues[11]).toBe('2027-03-01');
    });
  });
});
