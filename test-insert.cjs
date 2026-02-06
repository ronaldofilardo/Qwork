const { query } = require('../lib/db');

async function testInsert() {
  try {
    // Criar entidade
    const entidade = await query(`
      INSERT INTO entidades (cnpj, nome, tipo, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
      VALUES ('12345678000190', 'Entidade Teste', 'entidade', 'entidade@test.com', '11999999999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234567', 'Responsável Teste', '12345678901', 'resp@test.com', '11999999998', true)
      RETURNING id
    `);

    const entidadeId = entidade.rows[0].id;
    console.log('Entidade criada:', entidadeId);

    // Criar senha
    await query(`
      INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash)
      VALUES ($1, $2, $3)
    `, [entidadeId, '11111111111', '$2a$10$test']);

    console.log('Senha criada com sucesso!');

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testInsert();