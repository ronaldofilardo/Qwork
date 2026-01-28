const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});

async function checkRLS() {
  try {
    await client.connect();

    // Verificar políticas RLS
    const rlsResult = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE tablename = 'empresas_clientes'
    `);

    console.log('RLS na tabela empresas_clientes:');
    console.log(rlsResult.rows[0]);

    // Verificar políticas específicas
    const policiesResult = await client.query(`
      SELECT policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE tablename = 'empresas_clientes'
    `);

    console.log('Políticas RLS:');
    policiesResult.rows.forEach((policy) => {
      console.log(`- ${policy.policyname}: ${policy.cmd}`);
      console.log(`  Qual: ${policy.qual}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkRLS();
