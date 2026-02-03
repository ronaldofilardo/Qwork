const pg = require('pg');
require('./load-env.cjs').loadEnv();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkFunction() {
  try {
    const result = await pool.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'validar_sessao_rls'
    `);

    console.log('=== Definição da função validar_sessao_rls() ===');
    console.log(result.rows[0].definition);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkFunction();
