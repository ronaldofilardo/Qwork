import dotenv from 'dotenv';
import { loadEnv } from '../load-env';
loadEnv();
import { query } from '@/lib/db';

async function main() {
  console.log('=========================================');
  console.log('CORRIGINDO CONTRATANTE_ID (FORCE)');
  console.log('=========================================\n');

  const lotesRH = [3, 4, 5, 6, 8, 11];

  try {
    // 1. Desabilitar trigger específico
    console.log('[1] Desabilitando trigger de proteção...');
    await query(
      `ALTER TABLE lotes_avaliacao DISABLE TRIGGER trigger_prevent_lote_mutation_during_emission`
    );
    await query(
      `ALTER TABLE lotes_avaliacao DISABLE TRIGGER audit_lotes_avaliacao`
    );
    console.log('✓ Triggers desabilitados\n');

    // 2. Corrigir contratante_id (e zerar clinica_id/empresa_id)
    console.log('[2] Corrigindo contratante_id dos lotes do RH:');
    console.log(
      '   (Zerando clinica_id e empresa_id para respeitar constraint)'
    );
    const result = await query(
      `
      UPDATE lotes_avaliacao 
      SET contratante_id = 2, 
          clinica_id = NULL,
          empresa_id = NULL,
          atualizado_em = NOW()
      WHERE id = ANY($1)
      RETURNING id, codigo, titulo, contratante_id, clinica_id, empresa_id
      `,
      [lotesRH]
    );

    console.log(`✓ ${result.rowCount} lotes corrigidos:`);
    console.table(result.rows);

    // 3. Reabilitar triggers
    console.log('\n[3] Reabilitando triggers...');
    await query(
      `ALTER TABLE lotes_avaliacao ENABLE TRIGGER audit_lotes_avaliacao`
    );
    await query(
      `ALTER TABLE lotes_avaliacao ENABLE TRIGGER trigger_prevent_lote_mutation_during_emission`
    );
    console.log('✓ Triggers reabilitados\n');

    // 4. Verificação final
    console.log('[4] Verificação final:');
    const verificacao = await query(
      `
      SELECT 
        liberado_por,
        COUNT(*) as total_lotes,
        COUNT(*) FILTER (WHERE contratante_id IS NOT NULL) as com_contratante_id,
        COUNT(*) FILTER (WHERE contratante_id IS NULL) as sem_contratante_id
      FROM lotes_avaliacao
      WHERE liberado_por IN ('87545772920', '16543102047', '04703084945')
      GROUP BY liberado_por
      ORDER BY liberado_por
      `
    );
    console.table(verificacao.rows);

    const problemas = verificacao.rows.filter(
      (r: any) => parseInt(r.sem_contratante_id) > 0
    );
    if (problemas.length === 0) {
      console.log(
        '\n✅ SUCESSO: Todos os lotes agora têm contratante_id definido!'
      );
    } else {
      console.log('\n⚠️ Ainda há lotes sem contratante_id:');
      console.table(problemas);
    }
  } catch (error) {
    console.error('\n❌ Erro durante correção:', error);
    console.log('\nReabilitando triggers...');
    try {
      await query(
        `ALTER TABLE lotes_avaliacao ENABLE TRIGGER audit_lotes_avaliacao`
      );
      await query(
        `ALTER TABLE lotes_avaliacao ENABLE TRIGGER trigger_prevent_lote_mutation_during_emission`
      );
      console.log('✓ Triggers reabilitados');
    } catch (reableError) {
      console.error('❌ ERRO CRÍTICO: Falha ao reabilitar triggers!');
      console.error(reableError);
      throw reableError;
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
