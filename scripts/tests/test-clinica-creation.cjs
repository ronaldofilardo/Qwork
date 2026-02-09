const pg = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nr-bps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: false,
};

async function testClinicaCreation() {
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();

    // Primeiro, verificar se há tomadores do tipo clinica pendentes
    const tomadoresResult = await client.query(`
      SELECT id, nome, tipo, status FROM tomadores
      WHERE tipo = 'clinica' AND status = 'pendente'
      LIMIT 1
    `);

    if (tomadoresResult.rows.length === 0) {
      console.log(
        'Nenhum contratante clinica pendente encontrado. Criando um...'
      );

      // Criar um contratante clinica de teste
      const insertResult = await client.query(`
        INSERT INTO tomadores (
          tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          status, ativa
        ) VALUES (
          'clinica', 'Clinica Teste QWork 2', '98765432000198', 'teste2@clinica.com',
          '11999999999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234567',
          'Dr. Teste', '12345678901', 'drteste@clinica.com', '11999999999',
          'pendente', true
        ) RETURNING id
      `);

      console.log(
        'Contratante clinica criado com ID:',
        insertResult.rows[0].id
      );
      return;
    }

    const contratante = tomadoresResult.rows[0];
    console.log('Encontrado contratante clinica pendente:', contratante);

    // Aprovar o contratante (simulando a função aprovarContratante)
    await client.query(
      `
      UPDATE tomadores
      SET status = 'aprovado',
          ativa = true,
          aprovado_em = CURRENT_TIMESTAMP,
          aprovado_por_cpf = '00000000000',
          data_liberacao_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [contratante.id]
    );

    // Criar clinica
    const clinicaResult = await client.query(
      `
      INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, contratante_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (contratante_id) DO NOTHING
      RETURNING id
    `,
      [
        contratante.nome,
        '12345678000123', // cnpj do contratante
        'teste@clinica.com',
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        contratante.id,
      ]
    );

    if (clinicaResult.rows.length > 0) {
      console.log('✅ Clinica criada com ID:', clinicaResult.rows[0].id);
    } else {
      console.log('ℹ️ Clinica já existe para este contratante');
    }

    // Verificar clinicas existentes
    const clinicasResult = await client.query(
      'SELECT id, nome, contratante_id FROM clinicas'
    );
    console.log('Clinicas existentes:', clinicasResult.rows);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

testClinicaCreation();
