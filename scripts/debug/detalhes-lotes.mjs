import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log('🔍 Verificando códigos dos lotes em detalhes\n');

    // Ver todos os lotes com mais detalhes
    const lotes = await pool.query(`
      SELECT id, numero_ordem, codigo, liberado_em, titulo, descricao,
             EXTRACT(DAY FROM liberado_em) as dia,
             EXTRACT(MONTH FROM liberado_em) as mes,
             EXTRACT(YEAR FROM liberado_em) as ano
      FROM lotes_avaliacao
      WHERE empresa_id = 1
      ORDER BY numero_ordem
    `);

    console.log('📋 Detalhes completos dos lotes:');
    lotes.rows.forEach((lote) => {
      const data = lote.liberado_em?.toISOString().split('T')[0];
      const hora = lote.liberado_em?.toISOString().split('T')[1]?.split('.')[0];
      console.log(`   ID: ${lote.id}`);
      console.log(`   Número: ${lote.numero_ordem}`);
      console.log(`   Data completa: ${data} ${hora}`);
      console.log(`   Descrição: ${lote.descricao || 'N/A'}`);
      console.log('');
    });

    // Verificar se há lotes de outras empresas
    const todosLotes = await pool.query(`
      SELECT empresa_id, COUNT(*) as total
      FROM lotes_avaliacao
      GROUP BY empresa_id
      ORDER BY empresa_id
    `);

    console.log('\n🏢 Lotes por empresa:');
    todosLotes.rows.forEach((row) => {
      console.log(`   Empresa ${row.empresa_id}: ${row.total} lotes`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
})();
