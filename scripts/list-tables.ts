import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
});

async function listTables() {
  const result = await devPool.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  console.log('\n📋 Tabelas no banco:\n');
  result.rows.forEach((row, idx) => {
    console.log(`   ${idx + 1}. ${row.tablename}`);
  });
  console.log('');
}

async function main() {
  try {
    await listTables();
  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await devPool.end();
  }
}

main();
