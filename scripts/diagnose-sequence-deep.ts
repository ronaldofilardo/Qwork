import { query } from '../lib/db';

async function deepDiagnosis() {
  try {
    console.log('=== DIAGNÓSTICO PROFUNDO DA SEQUENCE ===\n');

    // 1. Verificar estrutura da tabela
    console.log('[1] Estrutura da coluna ID:');
    const columnInfo = await query(`
      SELECT 
        column_name, 
        column_default, 
        is_nullable, 
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'lotes_avaliacao' 
      AND column_name = 'id'
    `);
    console.log(columnInfo.rows[0]);

    // 2. Verificar ownership da sequence
    console.log('\n[2] Ownership da sequence:');
    const ownership = await query(`
      SELECT 
        s.relname as sequence_name,
        t.relname as table_name,
        a.attname as column_name
      FROM pg_class s
      JOIN pg_depend d ON d.objid = s.oid
      JOIN pg_class t ON d.refobjid = t.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
      WHERE s.relkind = 'S'
      AND s.relname = 'lotes_avaliacao_id_seq'
    `);
    console.log(ownership.rows[0] || 'NENHUM - SEQUENCE NÃO TEM OWNER!');

    // 3. Estado atual da sequence
    console.log('\n[3] Estado da sequence:');
    const seqState = await query(`
      SELECT last_value, is_called, log_cnt, increment_by 
      FROM lotes_avaliacao_id_seq
    `);
    console.log(seqState.rows[0]);

    // 4. Últimos IDs na tabela
    console.log('\n[4] Últimos 5 IDs:');
    const lastIds = await query(`
      SELECT id, codigo, status FROM lotes_avaliacao 
      ORDER BY id DESC LIMIT 5
    `);
    lastIds.rows.forEach((row) =>
      console.log(`  ID ${row.id}: ${row.codigo} (${row.status})`)
    );

    // 5. MAX ID
    console.log('\n[5] MAX(id):');
    const maxId = await query('SELECT MAX(id) as max_id FROM lotes_avaliacao');
    console.log('  ', maxId.rows[0].max_id);

    // 6. Testar qual ID será usado no próximo INSERT
    console.log('\n[6] Simulando INSERT sem executar:');
    console.log('  Iniciando transação...');
    await query('BEGIN');

    try {
      const testInsert = await query(`
        INSERT INTO lotes_avaliacao (
          codigo, clinica_id, empresa_id, titulo, descricao, 
          tipo, status, liberado_por, numero_ordem
        )
        VALUES (
          'TEST-000000', 999, 999, 'TEST', 'TEST', 
          'completo', 'ativo', '00000000000', 999
        )
        RETURNING id
      `);
      console.log('  ID que seria gerado:', testInsert.rows[0].id);

      await query('ROLLBACK');
      console.log('  Rollback executado (INSERT cancelado)');
    } catch (err: any) {
      await query('ROLLBACK');
      console.log('  ERRO no INSERT teste:', err.message);
    }

    // 7. Verificar se há gap entre sequence e max(id)
    const gap =
      parseInt(seqState.rows[0].last_value) - parseInt(maxId.rows[0].max_id);
    console.log('\n[7] Análise:');
    console.log(`  Sequence last_value: ${seqState.rows[0].last_value}`);
    console.log(`  MAX(id) na tabela: ${maxId.rows[0].max_id}`);
    console.log(`  Gap: ${gap}`);

    if (gap < 0) {
      console.log('  ⚠️  PROBLEMA: Sequence está ATRÁS do MAX(id)!');
    } else {
      console.log('  ✅ Sequence está à frente do MAX(id)');
    }
  } catch (error) {
    console.error('\n❌ ERRO:', error);
  } finally {
    process.exit(0);
  }
}

deepDiagnosis();
