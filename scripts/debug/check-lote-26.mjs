import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL });
(async () => {
  try {
    const loteId = 26;
    const loteRes = await pool.query(`SELECT id, codigo, status FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    console.log('Lote:', loteRes.rows[0]);

    const stats = await pool.query(`
      SELECT
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        COUNT(CASE WHEN a.status != 'inativada' THEN 1 END) as avaliacoes_ativas
      FROM avaliacoes a WHERE a.lote_id = $1
    `, [loteId]);
    console.log('Stats:', stats.rows[0]);

    // check taxa
    const avaliacoesAtivas = parseInt(stats.rows[0].avaliacoes_ativas) || 0;
    const concluidas = parseInt(stats.rows[0].avaliacoes_concluidas) || 0;
    const inativadas = parseInt(stats.rows[0].avaliacoes_inativadas) || 0;

    const taxa = avaliacoesAtivas > 0 ? (concluidas/avaliacoesAtivas)*100 : 0;

    console.log('avaliacoesAtivas=', avaliacoesAtivas,'concluidas=',concluidas,'inativadas=',inativadas,'taxa=',taxa);

    // check if indice completo
    const indiceRes = await pool.query(`
      SELECT COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicas,
        (
          SELECT COUNT(*)
          FROM generate_series(1,8) g
          CROSS JOIN LATERAL (
            SELECT DISTINCT item
            FROM respostas r2
            JOIN avaliacoes a2 ON r2.avaliacao_id = a2.id
            WHERE r2.grupo = g AND a2.status = 'concluida'
          ) items
        ) as total_questoes_necessarias
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1
        AND a.status = 'concluida'
        AND r.grupo IN (1,2,3,4,5,6,7,8)
    `,[loteId]);

    console.log('Indice check:', indiceRes.rows[0]);

    // check anomalias criticas
    const empresaRes = await pool.query(`SELECT COALESCE(empresa_id,0) as empresa_id FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    const empresaId = empresaRes.rows[0].empresa_id || 0;
    let anomalias = 0;
    if (empresaId>0) {
      const anom = await pool.query(`SELECT COUNT(*) as total_anom FROM (SELECT * FROM detectar_anomalias_indice($1)) anomalias JOIN avaliacoes a ON a.funcionario_cpf = anomalias.funcionario_cpf WHERE a.lote_id = $2 AND anomalias.severidade = 'CRÍTICA'`, [empresaId, loteId]);
      anomalias = parseInt(anom.rows[0].total_anom) || 0;
    }
    console.log('anomaliasCriticas=', anomalias);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();