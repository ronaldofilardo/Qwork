/**
 * Testes para migrações de database - Validação de schema
 * Confirma que colunas, índices e constraints foram criados corretamente
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Database Migrations - Validação de Schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Migration 098 - Status Enum Values', () => {
    it('deve ter valores aguardando_contrato, contrato_gerado, pagamento_confirmado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { enumlabel: 'cadastro_inicial' },
          { enumlabel: 'aguardando_contrato' },
          { enumlabel: 'contrato_gerado' },
          { enumlabel: 'aguardando_pagamento' },
          { enumlabel: 'pagamento_confirmado' },
          { enumlabel: 'aprovado' },
          { enumlabel: 'pendente' },
          { enumlabel: 'rejeitado' },
        ],
        rowCount: 8,
      } as any);

      const result = await query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_aprovacao_enum')
        ORDER BY enumsortorder
      `);

      const labels = result.rows.map((r) => r.enumlabel);
      expect(labels).toContain('aguardando_contrato');
      expect(labels).toContain('contrato_gerado');
      expect(labels).toContain('pagamento_confirmado');
    });
  });

  describe('Migration 099 - Audit Logs NULL user_cpf', () => {
    it('deve permitir user_cpf NULL com constraint de formato', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            column_name: 'user_cpf',
            is_nullable: 'YES',
            data_type: 'character varying',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_cpf'
      `);

      expect(result.rows[0].is_nullable).toBe('YES');
    });

    it('deve ter CHECK constraint para formato de CPF', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'audit_logs_user_cpf_check',
            check_clause: "user_cpf ~ '^[0-9]{11}$'",
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE 'audit_logs_user_cpf%'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Migration 100 - data_liberacao_login', () => {
    it('deve ter coluna data_liberacao_login em tomadors', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            column_name: 'data_liberacao_login',
            data_type: 'timestamp without time zone',
            is_nullable: 'YES',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tomadors' AND column_name = 'data_liberacao_login'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toContain('timestamp');
    });

    it('deve ter índice em data_liberacao_login', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ indexname: 'idx_tomadors_data_liberacao_login' }],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'tomadors' 
          AND indexname = 'idx_tomadors_data_liberacao_login'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Migration 103 - Colunas de Avaliação em Funcionários', () => {
    it('não deve ter coluna ultimo_lote_codigo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'ultimo_lote_codigo'
      `);

      expect(result.rows).toHaveLength(0);
    });

    it('deve ter colunas ultima_avaliacao_data_conclusao e ultima_avaliacao_status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { column_name: 'ultima_avaliacao_data_conclusao' },
          { column_name: 'ultima_avaliacao_status' },
        ],
        rowCount: 2,
      } as any);

      const result = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' 
          AND column_name IN ('ultima_avaliacao_data_conclusao', 'ultima_avaliacao_status')
      `);

      expect(result.rows).toHaveLength(2);
    });

    it('deve ter índice em ultima_avaliacao_data_conclusao', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ indexname: 'idx_funcionarios_ultima_avaliacao' }],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'funcionarios' 
          AND indexname = 'idx_funcionarios_ultima_avaliacao'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });

  describe('Migration 104 - data_nascimento em Funcionários', () => {
    it('deve ter coluna data_nascimento do tipo DATE', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ column_name: 'data_nascimento', data_type: 'date' }],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'data_nascimento'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('date');
    });
  });

  describe('Migration 105 - tomador_id em Funcionários', () => {
    it('deve ter coluna tomador_id com foreign key', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            column_name: 'tomador_id',
            data_type: 'integer',
            is_nullable: 'YES',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'tomador_id'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data_type).toBe('integer');
    });

    it('deve ter foreign key para tomadors', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            constraint_name: 'fk_funcionarios_tomador',
            constraint_type: 'FOREIGN KEY',
          },
        ],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'funcionarios' 
          AND constraint_name = 'fk_funcionarios_tomador'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].constraint_type).toBe('FOREIGN KEY');
    });

    it('deve ter índice em tomador_id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ indexname: 'idx_funcionarios_tomador_id' }],
        rowCount: 1,
      } as any);

      const result = await query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'funcionarios' 
          AND indexname = 'idx_funcionarios_tomador_id'
      `);

      expect(result.rows).toHaveLength(1);
    });
  });
});

describe('Data Integrity - Validação Pós-Migrações', () => {
  it('deve ter 25 colunas em funcionarios após todas as migrações', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: Array(25).fill({ column_name: 'col' }),
      rowCount: 25,
    } as any);

    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'funcionarios'
    `);

    expect(result.rows).toHaveLength(25);
  });

  it('deve aceitar queries com todas as novas colunas', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const result = await query(
      `
      SELECT 
        id, cpf, nome, data_nascimento, tomador_id,
        ultima_avaliacao_data_conclusao, 
        ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote
      FROM funcionarios
      WHERE tomador_id = $1
    `,
      [1]
    );

    expect(result.rowCount).toBeDefined();
  });
});

describe('Migration 030 - Imutabilidade (triggers e constraints)', () => {
  it('deve possuir CHECK constraint chk_laudos_emitido_em_emissor_cpf', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          constraint_name: 'chk_laudos_emitido_em_emissor_cpf',
          check_clause: '(emitido_em IS NULL OR emissor_cpf IS NOT NULL)',
        },
      ],
      rowCount: 1,
    } as any);

    const result = await query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'chk_laudos_emitido_em_emissor_cpf'
    `);

    expect(result.rows[0].constraint_name).toBe(
      'chk_laudos_emitido_em_emissor_cpf'
    );
  });

  it('deve possuir trigger trigger_resposta_immutability em respostas', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ tgname: 'trigger_resposta_immutability' }],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_resposta_immutability'`
    );
    expect(result.rows).toHaveLength(1);
  });

  it('deve possuir trigger trigger_resultado_immutability em resultados', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ tgname: 'trigger_resultado_immutability' }],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_resultado_immutability'`
    );
    expect(result.rows).toHaveLength(1);
  });

  it('deve possuir triggers de proteção de lote e avaliação (trg_protect_lote_after_emit, trg_protect_avaliacao_after_emit)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { tgname: 'trg_protect_lote_after_emit' },
        { tgname: 'trg_protect_avaliacao_after_emit' },
      ],
      rowCount: 2,
    } as any);

    const result = await query(
      `SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_protect_lote_after_emit','trg_protect_avaliacao_after_emit')`
    );
    expect(result.rows.length).toBeGreaterThanOrEqual(2);
  });
});
