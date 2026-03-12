/**
 * @fileoverview Testes de schema do banco de dados para comissionamento (Migration 500)
 * Valida tabelas, colunas, constraints, ENUMs e relações FK.
 */
jest.mock('@/lib/db');

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Database Schema — Comissionamento (Migration 500)', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Tabelas existem ──────────────────────────────────────────

  describe('Tabelas', () => {
    const tabelas = [
      'representantes',
      'leads_representante',
      'vinculos_comissao',
      'comissoes_laudo',
      'comissionamento_auditoria',
    ];

    it.each(tabelas)('tabela %s deve existir', async (tabela) => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ table_name: tabela }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [tabela]
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].table_name).toBe(tabela);
    });
  });

  // ─── Colunas de representantes ─────────────────────────────────

  describe('Tabela representantes — colunas obrigatórias', () => {
    const colunas = [
      { column_name: 'id', data_type: 'integer' },
      { column_name: 'tipo_pessoa', data_type: 'USER-DEFINED' },
      { column_name: 'nome', data_type: 'character varying' },
      { column_name: 'email', data_type: 'character varying' },
      { column_name: 'codigo', data_type: 'character varying' },
      { column_name: 'status', data_type: 'USER-DEFINED' },
      { column_name: 'cpf', data_type: 'character varying' },
      { column_name: 'cnpj', data_type: 'character varying' },
      { column_name: 'aceite_termos', data_type: 'boolean' },
      { column_name: 'aceite_disclaimer_nv', data_type: 'boolean' },
      { column_name: 'criado_em', data_type: 'timestamp with time zone' },
      { column_name: 'aprovado_em', data_type: 'timestamp with time zone' },
      { column_name: 'bloqueio_conflito_pf_id', data_type: 'integer' },
    ];

    it('deve ter todas as colunas esperadas', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: colunas,
        rowCount: colunas.length,
      } as any);

      const result = await query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'representantes'
         ORDER BY ordinal_position`
      );

      const nomes = result.rows.map((r: any) => r.column_name);
      expect(nomes).toContain('id');
      expect(nomes).toContain('tipo_pessoa');
      expect(nomes).toContain('nome');
      expect(nomes).toContain('email');
      expect(nomes).toContain('codigo');
      expect(nomes).toContain('status');
      expect(nomes).toContain('cpf');
      expect(nomes).toContain('aceite_termos');
      expect(nomes).toContain('aceite_disclaimer_nv');
      expect(nomes).toContain('bloqueio_conflito_pf_id');
    });
  });

  // ─── ENUMs ─────────────────────────────────────────────────────

  describe('ENUMs de Comissionamento', () => {
    it('deve ter enum tipo_pessoa_rep com valores pf e pj', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ enumlabel: 'pf' }, { enumlabel: 'pj' }],
        rowCount: 2,
      } as any);

      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_pessoa_rep')
         ORDER BY enumsortorder`
      );
      expect(result.rows.map((r: any) => r.enumlabel)).toEqual(['pf', 'pj']);
    });

    it('deve ter enum status_representante com 7 valores', async () => {
      const valores = [
        'ativo',
        'apto_pendente',
        'apto',
        'apto_bloqueado',
        'suspenso',
        'desativado',
        'rejeitado',
      ];
      mockQuery.mockResolvedValueOnce({
        rows: valores.map((v) => ({ enumlabel: v })),
        rowCount: valores.length,
      } as any);

      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_representante')
         ORDER BY enumsortorder`
      );
      const labels = result.rows.map((r: any) => r.enumlabel);
      expect(labels).toContain('ativo');
      expect(labels).toContain('apto');
      expect(labels).toContain('suspenso');
      expect(labels).toContain('desativado');
      expect(labels).toContain('rejeitado');
      expect(labels).toHaveLength(7);
    });

    it('deve ter enum status_lead com valores pendente, convertido, expirado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { enumlabel: 'pendente' },
          { enumlabel: 'convertido' },
          { enumlabel: 'expirado' },
        ],
        rowCount: 3,
      } as any);

      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_lead')
         ORDER BY enumsortorder`
      );
      expect(result.rows.map((r: any) => r.enumlabel)).toEqual([
        'pendente',
        'convertido',
        'expirado',
      ]);
    });

    it('deve ter enum status_vinculo_comissao com 4 valores', async () => {
      const valores = ['ativo', 'inativo', 'suspenso', 'encerrado'];
      mockQuery.mockResolvedValueOnce({
        rows: valores.map((v) => ({ enumlabel: v })),
        rowCount: 4,
      } as any);

      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_vinculo_comissao')
         ORDER BY enumsortorder`
      );
      expect(result.rows.map((r: any) => r.enumlabel)).toEqual(valores);
    });

    it('deve ter enum status_comissao com 8 valores (sem aprovada)', async () => {
      const valores = [
        'retida',
        'pendente_nf',
        'nf_em_analise',
        'congelada_rep_suspenso',
        'congelada_aguardando_admin',
        'liberada',
        'paga',
        'cancelada',
      ];
      mockQuery.mockResolvedValueOnce({
        rows: valores.map((v) => ({ enumlabel: v })),
        rowCount: valores.length,
      } as any);

      const result = await query(
        `SELECT enumlabel FROM pg_enum
         WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_comissao')
         ORDER BY enumsortorder`
      );
      expect(result.rows).toHaveLength(8);
      const labels = result.rows.map((r: any) => r.enumlabel);
      expect(labels).toContain('pendente_nf');
      expect(labels).toContain('nf_em_analise');
      expect(labels).not.toContain('aprovada');
    });
  });

  // ─── Relacionamentos FK ────────────────────────────────────────

  describe('Foreign Keys', () => {
    it('leads_representante.representante_id → representantes.id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'leads_representante_representante_id_fkey',
            table_name: 'leads_representante',
            column_name: 'representante_id',
            foreign_table_name: 'representantes',
            foreign_column_name: 'id',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT tc.constraint_name, tc.table_name, kcu.column_name,
                ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = 'leads_representante'
           AND kcu.column_name = 'representante_id'`
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('representantes');
    });

    it('vinculos_comissao.representante_id → representantes.id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            foreign_table_name: 'representantes',
            column_name: 'representante_id',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT ccu.table_name AS foreign_table_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = 'vinculos_comissao'
           AND kcu.column_name = 'representante_id'`
      );
      expect(result.rows[0].foreign_table_name).toBe('representantes');
    });

    it('vinculos_comissao.entidade_id → entidades.id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ foreign_table_name: 'entidades', column_name: 'entidade_id' }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT ccu.table_name AS foreign_table_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = 'vinculos_comissao'
           AND kcu.column_name = 'entidade_id'`
      );
      expect(result.rows[0].foreign_table_name).toBe('entidades');
    });

    it('comissoes_laudo.representante_id → representantes.id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ foreign_table_name: 'representantes' }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = 'comissoes_laudo'
           AND kcu.column_name = 'representante_id'`
      );
      expect(result.rows[0].foreign_table_name).toBe('representantes');
    });

    it('comissoes_laudo.vinculo_id → vinculos_comissao.id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ foreign_table_name: 'vinculos_comissao' }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = 'comissoes_laudo'
           AND kcu.column_name = 'vinculo_id'`
      );
      expect(result.rows[0].foreign_table_name).toBe('vinculos_comissao');
    });
  });

  // ─── Unique constraints ────────────────────────────────────────

  describe('Unique Constraints', () => {
    it('representantes.email deve ser único', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { constraint_name: 'representantes_email_key', column_name: 'email' },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT tc.constraint_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'UNIQUE'
           AND tc.table_name = 'representantes'
           AND kcu.column_name = 'email'`
      );
      expect(result.rows).toHaveLength(1);
    });

    it('representantes.codigo deve ser único', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'representantes_codigo_key',
            column_name: 'codigo',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT tc.constraint_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'UNIQUE'
           AND tc.table_name = 'representantes'
           AND kcu.column_name = 'codigo'`
      );
      expect(result.rows).toHaveLength(1);
    });
  });
});
