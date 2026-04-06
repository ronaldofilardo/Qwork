/**
 * Testes: Fluxo de Pagamento Pré-Emissão de Laudos
 *
 * Testa validações, constraints e funções SQL do novo fluxo de pagamento
 */

import { query } from '@/lib/db';

describe('Fluxo de Pagamento Pré-Emissão - SQL Validations', () => {
  test('1. Enum status_pagamento deve existir com valores corretos', async () => {
    const result = await query(
      `SELECT enum_range(NULL::status_pagamento) as valores`
    );

    const valores = result.rows[0].valores;
    expect(valores).toContain('aguardando_cobranca');
    expect(valores).toContain('aguardando_pagamento');
    expect(valores).toContain('pago');
    expect(valores).toContain('expirado');
  });

  test('2. Colunas de pagamento devem existir na tabela lotes_avaliacao', async () => {
    const result = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'lotes_avaliacao' 
         AND column_name IN (
           'status_pagamento', 'solicitacao_emissao_em', 'valor_por_funcionario',
           'link_pagamento_token', 'link_pagamento_expira_em', 'link_pagamento_enviado_em',
           'pagamento_metodo', 'pagamento_parcelas', 'pago_em'
         )
       ORDER BY column_name`
    );

    expect(result.rows.length).toBe(9);
  });

  test('3. View v_solicitacoes_emissao deve existir', async () => {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'v_solicitacoes_emissao'
      ) as exists`
    );

    expect(result.rows[0].exists).toBe(true);
  });

  test('4. Função calcular_valor_total_lote deve existir', async () => {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'calcular_valor_total_lote'
      ) as exists`
    );

    expect(result.rows[0].exists).toBe(true);
  });

  test('5. Função validar_token_pagamento deve existir', async () => {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validar_token_pagamento'
      ) as exists`
    );

    expect(result.rows[0].exists).toBe(true);
  });

  test('6. Índices devem estar criados', async () => {
    const result = await query(
      `SELECT indexname 
       FROM pg_indexes 
       WHERE tablename = 'lotes_avaliacao'
         AND indexname LIKE '%pagamento%'
       ORDER BY indexname`
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const indexNames = result.rows.map((r) => r.indexname);
    expect(indexNames).toContain('idx_lotes_avaliacao_status_pagamento');
  });

  test('7. Constraint valor_funcionario_positivo_check deve existir', async () => {
    const result = await query(
      `SELECT conname 
       FROM pg_constraint 
       WHERE conname = 'valor_funcionario_positivo_check'`
    );

    expect(result.rows.length).toBe(1);
  });

  test('8. Constraint pagamento_parcelas_range_check deve existir', async () => {
    const result = await query(
      `SELECT conname 
       FROM pg_constraint 
       WHERE conname = 'pagamento_parcelas_range_check'`
    );

    expect(result.rows.length).toBe(1);
  });

  test('9. Constraint pagamento_completo_check deve existir', async () => {
    const result = await query(
      `SELECT conname 
       FROM pg_constraint 
       WHERE conname = 'pagamento_completo_check'`
    );

    expect(result.rows.length).toBe(1);
  });

  test('10. Trigger audit_status_pagamento deve existir', async () => {
    const result = await query(
      `SELECT tgname 
       FROM pg_trigger 
       WHERE tgname = 'trg_audit_status_pagamento'`
    );

    expect(result.rows.length).toBe(1);
  });
});
