import dotenv from 'dotenv';
import { loadEnv } from '../load-env';
loadEnv();
import { query } from '@/lib/db';

async function main() {
  console.log('=========================================');
  console.log('CORRIGINDO tomador_ID DOS LOTES');
  console.log('=========================================\n');

  // Lotes do RH (04703084945, tomador_id = 2)
  const lotesRH = [3, 4, 5, 6, 8, 11];

  console.log('[1] Corrigindo lotes do RH (04703084945):');
  console.log(`   Lotes: ${lotesRH.join(', ')}`);
  console.log('   Definindo tomador_id = 2\n');

  const result = await query(
    `
    UPDATE lotes_avaliacao 
    SET tomador_id = 2, atualizado_em = NOW()
    WHERE id = ANY($1) AND tomador_id IS NULL
    RETURNING id, codigo, titulo, tomador_id
    `,
    [lotesRH]
  );

  console.log(`✓ ${result.rowCount} lotes corrigidos:`);
  console.table(result.rows);

  // Verificação final
  console.log('\n[2] Verificação final:');
  const verificacao = await query(
    `
    SELECT 
      liberado_por,
      COUNT(*) as total_lotes,
      COUNT(*) FILTER (WHERE tomador_id IS NOT NULL) as com_tomador_id,
      COUNT(*) FILTER (WHERE tomador_id IS NULL) as sem_tomador_id
    FROM lotes_avaliacao
    WHERE liberado_por IN ('87545772920', '16543102047', '04703084945')
    GROUP BY liberado_por
    ORDER BY liberado_por
    `
  );
  console.table(verificacao.rows);

  const problemas = verificacao.rows.filter(
    (r: any) => parseInt(r.sem_tomador_id) > 0
  );
  if (problemas.length === 0) {
    console.log(
      '\n✅ SUCESSO: Todos os lotes agora têm tomador_id definido!'
    );
  } else {
    console.log('\n⚠️ Ainda há lotes sem tomador_id:');
    console.table(problemas);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
