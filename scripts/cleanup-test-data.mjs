import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.development' });

async function cleanup() {
  const { Pool } = pg;
  const databaseUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.LOCAL_DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      '❌ ERRO: Nenhuma URL de banco configurada. Configure TEST_DATABASE_URL para apontar para o banco de testes antes de executar o cleanup.'
    );
    process.exit(2);
  }

  // Segurança: não permitir rodar contra banco de desenvolvimento sem confirmação explícita
  try {
    const parsed = new URL(databaseUrl);
    const dbName = parsed.pathname.replace(/^\//, '');
    if (
      (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') &&
      !process.env.ALLOW_DEV_CLEANUP
    ) {
      console.error(
        '❌ Segurança: o script de cleanup detectou que a conexão aponta para o banco de desenvolvimento (nr-bps_db).'
      );
      console.error(
        'Se realmente deseja executar o cleanup no banco de desenvolvimento, exporte ALLOW_DEV_CLEANUP=1 e execute novamente.'
      );
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ ERRO ao analisar database URL:', err.message || err);
    process.exit(2);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    console.log('🔍 Procurando lotes de teste (codigo LIKE "TEST-%")...');
    const lotes = await pool.query(
      `SELECT id, codigo FROM lotes_avaliacao WHERE codigo LIKE 'TEST-%'`
    );
    if (lotes.rows.length === 0) {
      console.log('✅ Nenhum lote de teste encontrado.');
      return;
    }

    console.log(
      `🗑️  Encontrados ${lotes.rows.length} lote(s) de teste. Removendo avaliações relacionadas e os lotes...`
    );

    for (const lote of lotes.rows) {
      const loteId = lote.id;
      console.log(`  - Limpando avaliações do lote ID ${loteId}`);
      await pool.query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await pool.query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      console.log(`    ✅ Lote #${loteId} removido.`);
    }

    console.log('🎉 Cleanup finalizado com sucesso.');
  } catch (err) {
    console.error('❌ Erro durante cleanup:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanup().catch((e) => {
  console.error('❌ Erro inesperado no cleanup:', e);
  process.exit(1);
});
