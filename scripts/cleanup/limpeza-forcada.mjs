import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log('🧹 FORÇANDO LIMPEZA FINAL DOS RESULTADOS ÓRFÃOS...\n');

    // Obter IDs dos resultados órfãos
    const orfaos = await pool.query(`
      SELECT r.id FROM resultados r
      WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)
    `);

    const idsOrfaos = orfaos.rows.map(r => r.id);
    console.log(`Encontrados ${idsOrfaos.length} resultados órfãos`);

    if (idsOrfaos.length > 0) {
      // Dividir em lotes para evitar problemas de performance
      const loteSize = 100;
      let totalDeletados = 0;

      for (let i = 0; i < idsOrfaos.length; i += loteSize) {
        const lote = idsOrfaos.slice(i, i + loteSize);
        const deleteLote = await pool.query(`
          DELETE FROM resultados WHERE id = ANY($1)
        `, [lote]);

        totalDeletados += deleteLote.rowCount;
        console.log(`  Lote ${Math.floor(i/loteSize) + 1}: deletados ${deleteLote.rowCount} registros`);
      }

      console.log(`\n✅ Total de resultados órfãos deletados: ${totalDeletados}`);
    }

    // Verificação final
    const finalCheck = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id IS NULL) as avaliacoes_orfas,
        (SELECT COUNT(*) FROM resultados r WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.id = r.avaliacao_id)) as resultados_orfaos,
        (SELECT COUNT(*) FROM avaliacoes WHERE lote_id IS NOT NULL) as avaliacoes_validas,
        (SELECT COUNT(*) FROM resultados) as resultados_validos
    `);

    const stats = finalCheck.rows[0];
    console.log('\n🔍 Status final do banco:');
    console.log(`   - Avaliações órfãs: ${stats.avaliacoes_orfas}`);
    console.log(`   - Resultados órfãos: ${stats.resultados_orfaos}`);
    console.log(`   - Avaliações válidas: ${stats.avaliacoes_validas}`);
    console.log(`   - Resultados válidos: ${stats.resultados_validos}`);

    if (parseInt(stats.avaliacoes_orfas) === 0 && parseInt(stats.resultados_orfaos) === 0) {
      console.log('\n🎉 LIMPEZA TOTAL CONCLUÍDA!');
      console.log('Banco de dados completamente limpo para nova fase de testes.');
      console.log('Agora só existem dados válidos associados aos lotes 001-171225, 002-171225 e 003-171225.');
    } else {
      console.log('\n⚠️  Ainda há dados órfãos, mas eles não afetam a funcionalidade.');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
})();