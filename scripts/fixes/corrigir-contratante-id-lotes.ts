import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from '@/lib/db';

async function main() {
  console.log('=========================================');
  console.log('CORRIGINDO CONTRATANTE_ID DOS LOTES');
  console.log('=========================================\n');

  // Lotes do RH (04703084945, contratante_id = 2)
  const lotesRH = [3, 4, 5, 6, 8, 11];

  console.log('[1] Corrigindo lotes do RH (04703084945):');
  console.log(`   Lotes: ${lotesRH.join(', ')}`);
  console.log('   Definindo contratante_id = 2\n');

  const result = await query(
    `
    UPDATE lotes_avaliacao 
    SET contratante_id = 2, atualizado_em = NOW()
    WHERE id = ANY($1) AND contratante_id IS NULL
    RETURNING id, codigo, titulo, contratante_id
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
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
