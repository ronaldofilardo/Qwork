const pg = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nr-bps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: false,
};

async function checkRHUsers() {
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();

    // Verificar funcionarios RH associados à clinica 1
    const rhResult = await client.query(`
      SELECT f.id, f.cpf, f.nome, f.perfil, f.clinica_id, f.ativo
      FROM funcionarios f
      WHERE f.perfil = 'rh' AND f.clinica_id = 1
    `);

    console.log('Funcionarios RH da clinica 1:', rhResult.rows);

    if (rhResult.rows.length === 0) {
      console.log('Criando usuario RH para teste...');

      // Criar um funcionario RH
      const insertResult = await client.query(`
        INSERT INTO funcionarios (
          cpf, nome, email, perfil, clinica_id, ativo, setor, funcao, nivel_cargo, senha_hash
        ) VALUES (
          '11122233344', 'RH Teste', 'rh@teste.com', 'rh', 1, true, 'RH', 'Analista', 'operacional', '$2b$10$dummy.hash.for.testing.purposes.only'
        ) RETURNING id
      `);

      console.log('Funcionario RH criado com ID:', insertResult.rows[0].id);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkRHUsers();
