/**
 * Teste de integração: Liberar lote para entidade
 * Valida as correções aplicadas em 23/01/2026:
 * - Migration 016 aplicada (numero_ordem, obter_proximo_numero_ordem)
 * - Migration 015 aplicada (calcular_elegibilidade_lote_contratante)
 * - Migration 204 aplicada (liberado_por nullable)
 * - View vw_funcionarios_por_lote criada
 */

import { query } from '@/lib/db';

describe('Integration: Liberar lote para entidade', () => {
  beforeAll(async () => {
    // Validar ambiente de teste
    if (!process.env.TEST_DATABASE_URL || !String(process.env.TEST_DATABASE_URL).includes('_test')) {
      throw new Error('TEST_DATABASE_URL não configurado para testes de integração');
    }
  });

  it('✅ função obter_proximo_numero_ordem deve existir', async () => {
    const result = await query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname = 'obter_proximo_numero_ordem'
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].proname).toBe('obter_proximo_numero_ordem');
    expect(result.rows[0].pronargs).toBe(1); // 1 argumento: p_empresa_id
  });

  it('✅ função calcular_elegibilidade_lote deve existir', async () => {
    const result = await query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname = 'calcular_elegibilidade_lote'
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].pronargs).toBe(2); // 2 argumentos: p_empresa_id, p_numero_lote_atual
  });

  it('✅ função calcular_elegibilidade_lote_contratante deve existir', async () => {
    const result = await query(`
      SELECT proname, pronargs
      FROM pg_proc
      WHERE proname = 'calcular_elegibilidade_lote_contratante'
    `);

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].pronargs).toBe(2); // 2 argumentos: p_contratante_id, p_numero_lote_atual
  });

  it('✅ coluna lotes_avaliacao.numero_ordem deve existir', async () => {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao' AND column_name = 'numero_ordem'
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].data_type).toBe('integer');
    expect(result.rows[0].is_nullable).toBe('NO');
  });

  it('✅ coluna lotes_avaliacao.liberado_por deve aceitar NULL', async () => {
    const result = await query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao' AND column_name = 'liberado_por'
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].is_nullable).toBe('YES');
  });

  it('✅ view vw_funcionarios_por_lote deve existir', async () => {
    const result = await query(`
      SELECT viewname
      FROM pg_views
      WHERE viewname = 'vw_funcionarios_por_lote'
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].viewname).toBe('vw_funcionarios_por_lote');
  });

  it('✅ view vw_funcionarios_por_lote deve incluir colunas de inativação', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vw_funcionarios_por_lote'
      AND column_name IN ('data_inativacao', 'motivo_inativacao')
    `);

    expect(result.rows.length).toBe(2);
    const columns = result.rows.map(r => r.column_name);
    expect(columns).toContain('data_inativacao');
    expect(columns).toContain('motivo_inativacao');
  });

  it('✅ colunas funcionarios.indice_avaliacao e data_ultimo_lote devem existir', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'funcionarios'
      AND column_name IN ('indice_avaliacao', 'data_ultimo_lote')
      ORDER BY column_name
    `);

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].column_name).toBe('data_ultimo_lote');
    expect(result.rows[1].column_name).toBe('indice_avaliacao');
    expect(result.rows[1].data_type).toBe('integer');
  });
});
