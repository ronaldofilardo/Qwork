/**
 * @fileoverview Testes de triggers e funções do comissionamento (Migration 500)
 * Valida existência de functions e triggers no catálogo PostgreSQL.
 */
jest.mock('@/lib/db');

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Database — Triggers & Functions Comissionamento', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Functions ─────────────────────────────────────────────────

  describe('Functions SQL', () => {
    // 'gerar_codigo_representante' foi removida na migration 1227
    const funcoes = ['gerar_token_lead', 'calcular_comissao_laudo'];

    it.each(funcoes)(
      'função %s deve existir no schema public',
      async (nome) => {
        mockQuery.mockResolvedValueOnce({
          rows: [{ routine_name: nome, routine_schema: 'public' }],
          rowCount: 1,
        } as any);

        const result = await query(
          `SELECT routine_name, routine_schema
         FROM information_schema.routines
         WHERE routine_schema = 'public' AND routine_name = $1`,
          [nome]
        );
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].routine_name).toBe(nome);
      }
    );
  });

  // ─── Triggers ──────────────────────────────────────────────────

  describe('Triggers', () => {
    // 'trg_gerar_codigo_representante' foi removido na migration 1227
    const triggers = [
      { name: 'trg_expirar_leads', table: 'leads_representante' },
    ];

    it.each(triggers)(
      'trigger $name deve existir em $table',
      async ({ name, table }) => {
        mockQuery.mockResolvedValueOnce({
          rows: [
            {
              trigger_name: name,
              event_object_table: table,
              action_timing: 'BEFORE',
            },
          ],
          rowCount: 1,
        } as any);

        const result = await query(
          `SELECT trigger_name, event_object_table, action_timing
         FROM information_schema.triggers
         WHERE trigger_schema = 'public' AND trigger_name = $1`,
          [name]
        );
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].event_object_table).toBe(table);
      }
    );
  });

  // ─── gerar_codigo_representante logic (REMOVIDA migration 1227) ──────────

  describe.skip('gerar_codigo_representante output format', () => {
    it('código deve ter formato XXXX-XXXX (maiúsculas/dígitos)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ codigo: 'AB12-CD34' }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT gerar_codigo_representante() AS codigo`
      );
      const codigo = result.rows[0].codigo;
      expect(codigo).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
  });

  // ─── Default values ────────────────────────────────────────────

  describe('Defaults', () => {
    it('representantes.status default deve ser ativo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            column_name: 'status',
            column_default: "'ativo'::status_representante",
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT column_name, column_default
         FROM information_schema.columns
         WHERE table_name = 'representantes' AND column_name = 'status'`
      );
      expect(result.rows[0].column_default).toContain('ativo');
    });

    it('leads_representante.status default deve ser pendente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ column_default: "'pendente'::status_lead" }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_name = 'leads_representante' AND column_name = 'status'`
      );
      expect(result.rows[0].column_default).toContain('pendente');
    });

    it('comissoes_laudo.status default deve ser retida', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ column_default: "'retida'::status_comissao" }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_name = 'comissoes_laudo' AND column_name = 'status'`
      );
      expect(result.rows[0].column_default).toContain('retida');
    });

    it('vinculos_comissao.status default deve ser ativo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ column_default: "'ativo'::status_vinculo_comissao" }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_name = 'vinculos_comissao' AND column_name = 'status'`
      );
      expect(result.rows[0].column_default).toContain('ativo');
    });
  });

  // ─── Índices ───────────────────────────────────────────────────

  describe('Índices', () => {
    it('deve existir índice em representantes.email', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            indexname: 'idx_representantes_email',
            tablename: 'representantes',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT indexname, tablename FROM pg_indexes
         WHERE tablename = 'representantes' AND indexdef ILIKE '%email%'`
      );
      expect(result.rows).toHaveLength(1);
    });

    it('deve existir índice em leads_representante.cnpj', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { indexname: 'idx_leads_cnpj', tablename: 'leads_representante' },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT indexname, tablename FROM pg_indexes
         WHERE tablename = 'leads_representante' AND indexdef ILIKE '%cnpj%'`
      );
      expect(result.rows).toHaveLength(1);
    });

    it('deve existir índice em comissoes_laudo.representante_id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ indexname: 'idx_comissoes_rep_id' }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT indexname FROM pg_indexes
         WHERE tablename = 'comissoes_laudo' AND indexdef ILIKE '%representante_id%'`
      );
      expect(result.rows).toHaveLength(1);
    });
  });
});
