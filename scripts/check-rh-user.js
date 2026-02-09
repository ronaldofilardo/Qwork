const pg = require('pg');
require('./load-env.cjs').loadEnv();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkRHUser() {
  try {
    // Verificar dados do RH
    const result = await pool.query(
      'SELECT cpf, usuario_tipo, ativo, clinica_id, tomador_id FROM funcionarios WHERE cpf = $1',
      ['04703084945']
    );

    console.log('=== Dados do Usuário RH ===');
    console.log(JSON.stringify(result.rows[0], null, 2));

    // Verificar relação com empresas_clientes
    const empresas = await pool.query(
      `SELECT id, nome, clinica_id 
       FROM empresas_clientes 
       WHERE id IN (
         SELECT empresa_id FROM funcionarios_empresas WHERE cpf = $1
       )`,
      ['04703084945']
    );

    console.log('\n=== Empresas vinculadas ao RH ===');
    console.log(JSON.stringify(empresas.rows, null, 2));
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkRHUser();
