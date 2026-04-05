const pg = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nr-bps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: false,
};

async function testEmpresaCreation() {
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();

    // Verificar se há clinicas
    const clinicasResult = await client.query(
      'SELECT id, nome, contratante_id FROM clinicas'
    );
    console.log('Clinicas disponíveis:', clinicasResult.rows);

    // Verificar funcionarios RH
    const rhResult = await client.query(`
      SELECT f.id, f.cpf, f.nome, f.perfil, f.clinica_id
      FROM funcionarios f
      WHERE f.perfil = 'rh' AND f.ativo = true
    `);
    console.log('Funcionarios RH ativos:', rhResult.rows);

    // Tentar criar uma empresa (simulando a API)
    const clinicaId = 1; // clinica criada anteriormente
    const empresaData = {
      nome: 'Empresa Teste RH',
      cnpj: '11223344000155',
      email: 'empresa@teste.com',
      telefone: '11988887777',
      endereco: 'Rua Empresa, 456',
      cidade: 'São Paulo',
      estado: 'SP',
    };

    console.log('Tentando criar empresa com clinica_id:', clinicaId);

    const insertResult = await client.query(
      `
      INSERT INTO empresas_clientes (
        nome, cnpj, email, telefone, endereco, cidade, estado, clinica_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        empresaData.nome,
        empresaData.cnpj,
        empresaData.email,
        empresaData.telefone,
        empresaData.endereco,
        empresaData.cidade,
        empresaData.estado,
        clinicaId,
      ]
    );

    console.log('✅ Empresa criada com sucesso! ID:', insertResult.rows[0].id);
  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error.message);
  } finally {
    await client.end();
  }
}

testEmpresaCreation();
