import { Client } from 'pg';

async function createView() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query(`
      CREATE VIEW IF NOT EXISTS v_entidades_stats AS
      SELECT entidade_id as id, COUNT(*) as funcionarios_ativos
      FROM funcionarios
      WHERE ativo = true
      GROUP BY entidade_id;
    `);
    console.log('View v_entidades_stats criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar view:', error);
  } finally {
    await client.end();
  }
}

createView();
