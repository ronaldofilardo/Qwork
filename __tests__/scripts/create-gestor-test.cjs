const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const client = new Client({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: process.env.TEST_DATABASE_URL?.split('/').pop() || 'nr-bps_db_test',
});

(async function () {
  try {
    await client.connect();

    // Novo CPF para gestor de entidade
    const cpfGestor = '98765432100';
    const senhaOriginal = '000195'; // Última 6 dígitos do CNPJ da entidade 7

    // Hash da senha
    const senhaHash = await bcrypt.hash(senhaOriginal, 10);

    // Inserir em usuarios
    const uRes = await client.query(
      `INSERT INTO usuarios (cpf, nome, tipo_usuario, entidade_id, ativo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cpf) DO UPDATE SET tipo_usuario = EXCLUDED.tipo_usuario
       RETURNING *`,
      [cpfGestor, 'Gestor Test', 'gestor', 7, true]
    );

    console.log('Usuário criado:', uRes.rows[0]);

    // Verificar se já existe em entidades_senhas
    const sRes = await client.query(
      'SELECT * FROM entidades_senhas WHERE cpf = $1',
      [cpfGestor]
    );

    if (sRes.rows.length === 0) {
      // Se não existe, inserir
      const sInsert = await client.query(
        `INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [7, cpfGestor, senhaHash]
      );
      console.log('Senha criada:', sInsert.rows[0]);
    } else {
      console.log('Senha já existe:', sRes.rows[0]);
    }
  } finally {
    await client.end();
  }
})();
