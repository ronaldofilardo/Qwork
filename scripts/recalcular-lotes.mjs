import pg from 'pg';
import fs from 'fs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.development' });

async function recalcularLotes() {
  const { Pool } = pg;
  let pool = null;

  try {
    const databaseUrl =
      process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL ou LOCAL_DATABASE_URL não configurada');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('🔄 Recalculando status de todos os lotes...');

    // Buscar todos os lotes ativos
    const lotes = await pool.query(`
      SELECT id, codigo, status
      FROM lotes_avaliacao
      WHERE status IN ('ativo', 'concluido')
      ORDER BY id
    `);

    console.log(`Encontrados ${lotes.rows.length} lotes para verificar`);

    for (const lote of lotes.rows) {
      // Recalcular status baseado nas avaliações
      const stats = await pool.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE a.status != 'inativada') as ativas,
          COUNT(*) FILTER (WHERE a.status = 'concluida') as concluidas
        FROM avaliacoes a
        WHERE a.lote_id = $1
      `,
        [lote.id]
      );

      const { ativas, concluidas } = stats.rows[0];
      const ativasNum = parseInt(ativas) || 0;
      const concluidasNum = parseInt(concluidas) || 0;

      const novoStatus =
        ativasNum > 0 && concluidasNum === ativasNum ? 'concluido' : 'ativo';

      if (novoStatus !== lote.status) {
        if (novoStatus === 'concluido') {
          await pool.query(
            `
            UPDATE lotes_avaliacao
            SET status = $1, atualizado_em = NOW()
            WHERE id = $2
          `,
            [novoStatus, lote.id]
          );
          console.log(
            `✅ ${lote.codigo}: ${lote.status} → ${novoStatus} (emissão agendada)`
          );
        } else {
          await pool.query(
            'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
            [novoStatus, lote.id]
          );
          console.log(`✅ ${lote.codigo}: ${lote.status} → ${novoStatus}`);
        }
      } else {
        console.log(`➡️ ${lote.codigo}: status já correto (${lote.status})`);
      }
    }

    console.log('🎉 Recálculo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

recalcularLotes();
