import pg from 'pg';

const { Pool } = pg;

async function queryProduction() {
  // Usar DATABASE_URL que aponta para o Neon em produção
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL não encontrada!');
    console.log('\nVerifique se existe no arquivo .env.local');
    process.exit(1);
  }

  console.log('🔍 Conectando no banco de PRODUÇÃO (Neon)...');
  console.log(
    'Host:',
    connectionString.includes('neon.tech') ? '✅ Neon' : '❌ NÃO É NEON!'
  );
  console.log('');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Verificar conexão
    const dbInfo = await pool.query('SELECT current_database(), version()');
    console.log('📊 Database:', dbInfo.rows[0].current_database);
    console.log(
      '📊 Version:',
      dbInfo.rows[0].version.split(' ').slice(0, 2).join(' ')
    );
    console.log('');

    // Consultar as avaliações 1-4
    console.log('═══════════════════════════════════════════════════════════');
    console.log('AVALIAÇÕES #1, #2, #3, #4 - PRODUÇÃO NEON');
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );

    const result = await pool.query(
      'SELECT id, funcionario_cpf, status, inicio, envio FROM avaliacoes WHERE id IN (1,2,3,4) ORDER BY id'
    );

    console.table(result.rows);

    // Contar respostas
    console.log('\n📝 Contagem de respostas:\n');

    for (const av of result.rows) {
      const countResult = await pool.query(
        'SELECT COUNT(DISTINCT (grupo, item)) as total FROM respostas WHERE avaliacao_id = $1',
        [av.id]
      );
      console.log(
        `  Avaliação #${av.id}: ${countResult.rows[0].total} respostas`
      );
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }

  process.exit(0);
}

queryProduction().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
