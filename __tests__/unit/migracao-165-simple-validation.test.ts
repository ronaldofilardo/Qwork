/**
 * Teste Simples para Validar Migração 165
 * Apenas valida que a trigger funciona
 */

import { query } from '@/lib/db';

describe('Migração 165 - Validação Simples', () => {
  it('✅ Função trigger existe e não tenta acessar l.codigo', async () => {
    const result = await query(
      `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'atualizar_ultima_avaliacao_funcionario'`,
      []
    );

    expect(result.rows).toHaveLength(1);
    const funcao = result.rows[0].pg_get_functiondef;

    // Validação: não deve tentar fazer SELECT l.codigo
    expect(funcao).not.toMatch(/SELECT.*l\.codigo/i);
    console.log('✅ Função trigger corrigida - não tenta acessar l.codigo');
  });

  it('✅ Campos denormalizados existem na tabela funcionarios', async () => {
    const result = await query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'funcionarios' 
       AND (column_name = 'ultima_avaliacao_id' 
            OR column_name = 'ultima_avaliacao_status' 
            OR column_name = 'ultima_avaliacao_data_conclusao')`,
      []
    );

    expect(result.rows.length).toBeGreaterThanOrEqual(3);
    console.log(`✅ Encontrados ${result.rows.length} campos denormalizados`);
  });

  it('✅ Migração 165 não tenta atualizar colunas removidas', async () => {
    const result = await query(
      `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'atualizar_ultima_avaliacao_funcionario'`,
      []
    );

    const funcao = result.rows[0].pg_get_functiondef;

    // Não deve tentar atualizar ultimo_lote_codigo
    expect(funcao).not.toMatch(/ultimo_lote_codigo/i);
    console.log('✅ Função não tenta atualizar colunas removidas');
  });
});
