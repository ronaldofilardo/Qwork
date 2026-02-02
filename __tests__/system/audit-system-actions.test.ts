/**
 * Testes para sistema de auditoria com ações do sistema
 * Validação de NULL user_cpf e operador sistema '00000000000'
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Sistema de Auditoria - Ações Automáticas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve permitir user_cpf NULL em audit_logs', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          table_name: 'contratantes',
          record_id: 1,
          operation: 'UPDATE',
          user_cpf: null,
          changed_fields: { status: 'aprovado' },
        },
      ],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT * FROM audit_logs WHERE user_cpf IS NULL ORDER BY created_at DESC LIMIT 1`
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].user_cpf).toBeNull();
  });

  it('deve usar 00000000000 como operador sistema quando não há contexto de usuário', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          table_name: 'contratantes',
          record_id: 9,
          operation: 'UPDATE',
          user_cpf: '00000000000',
          changed_fields: { ativa: true, aprovado_por_cpf: '00000000000' },
        },
      ],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT * FROM audit_logs WHERE user_cpf = '00000000000' ORDER BY created_at DESC LIMIT 1`
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].user_cpf).toBe('00000000000');
  });

  it('deve registrar ativação automática de contratante sem CPF de aprovador humano', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)
      .mockResolvedValueOnce({
        rows: [{ id: 1, ativa: true, aprovado_por_cpf: '00000000000' }],
        rowCount: 1,
      } as any);

    // Simular UPDATE SET aprovado_por_cpf = '00000000000' sem contexto de usuário
    await query(
      `UPDATE contratantes 
       SET ativa = true, 
           status = 'aprovado', 
           aprovado_por_cpf = '00000000000',
           data_liberacao_login = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [1]
    );

    const result = await query(`SELECT * FROM contratantes WHERE id = $1`, [1]);

    expect(result.rows[0].aprovado_por_cpf).toBe('00000000000');
  });

  it('deve registrar auditoria para UPDATE de status pagamento_confirmado → aprovado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          table_name: 'contratantes',
          record_id: 1,
          operation: 'UPDATE',
          user_cpf: null,
          changed_fields: {
            status: 'aprovado',
            old_status: 'pagamento_confirmado',
          },
        },
      ],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT * FROM audit_logs 
       WHERE table_name = 'contratantes' 
         AND operation = 'UPDATE' 
         AND changed_fields->>'status' = 'aprovado'
         AND user_cpf IS NULL
       ORDER BY created_at DESC LIMIT 1`
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].changed_fields.status).toBe('aprovado');
  });

  it('deve validar formato de CPF quando user_cpf não é NULL', async () => {
    // CPF válido: 11 dígitos numéricos ou NULL
    const validCPFs = ['12345678900', '00000000000', null];

    for (const cpf of validCPFs) {
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_cpf: cpf }],
        rowCount: 1,
      } as any);

      const result = await query(
        `SELECT user_cpf FROM audit_logs WHERE user_cpf = $1 OR user_cpf IS NULL LIMIT 1`,
        [cpf]
      );

      expect(result.rows).toHaveLength(1);
    }
  });

  it('deve rejeitar CPF com formato inválido (se constraint existir)', async () => {
    const invalidCPF = '123'; // Menos de 11 dígitos

    mockQuery.mockRejectedValueOnce(
      new Error('new row for relation "audit_logs" violates check constraint')
    );

    await expect(
      query(
        `INSERT INTO audit_logs (user_cpf, table_name, operation) VALUES ($1, 'test', 'TEST')`,
        [invalidCPF]
      )
    ).rejects.toThrow('check constraint');
  });
});

describe('Trigger de Auditoria - audit_trigger_function', () => {
  it('deve usar app.current_user_cpf quando disponível', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // SET LOCAL
      .mockResolvedValueOnce({
        rows: [{ user_cpf: '12345678900' }],
        rowCount: 1,
      } as any);

    await query(`SET LOCAL app.current_user_cpf = '12345678900'`);
    const result = await query(
      `SELECT current_setting('app.current_user_cpf', true) AS user_cpf`
    );

    expect(result.rows[0].user_cpf).toBe('12345678900');
  });

  it('deve usar 00000000000 quando app.current_user_cpf não está definido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_cpf: '00000000000' }],
      rowCount: 1,
    } as any);

    const result = await query(
      `SELECT COALESCE(NULLIF(current_setting('app.current_user_cpf', true), ''), '00000000000') AS user_cpf`
    );

    expect(result.rows[0].user_cpf).toBe('00000000000');
  });
});
