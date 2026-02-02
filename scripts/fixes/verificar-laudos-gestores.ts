import { query } from '../../lib/db';

async function verificarLaudos() {
  const result = await query(`
    SELECT 
      l.id,
      l.lote_id,
      la.codigo,
      la.liberado_por,
      l.emissor_cpf,
      l.status,
      l.emitido_em,
      l.hash_pdf IS NOT NULL as tem_hash
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE la.liberado_por IN ('87545772920', '16543102047')
    ORDER BY l.id DESC
  `);

  console.log(`Total de laudos encontrados: ${result.rows.length}\n`);
  console.table(result.rows);
  process.exit(0);
}

verificarLaudos();
